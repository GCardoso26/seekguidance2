# Cursor Prompt — Judge TCG: RAG Quality, HNSW, HyDE, Chunking & Frontend UX

## Contexto do projeto

Este é o **Judge TCG** (`judgetcg.com.br`), um assistente de regras para Trading Card Games.
O monorepo tem a seguinte estrutura crítica:

```
tcg-judge/
├── services/
│   ├── api/app/
│   │   ├── api/v1/runtime_judge.py        # Router principal do Judge
│   │   ├── application/rag_orchestrator.py # Pipeline RAG central
│   │   ├── retrieval/
│   │   │   ├── confidence.py              # Score de confiança
│   │   │   └── confidence_profiles.py     # Perfis por game_slug
│   │   ├── judge/registry.py              # Mapeamento tcg → game_slug
│   │   └── core/config.py                 # Variáveis de ambiente
│   └── ingestion/tcg_judge_ingestion/     # Pipeline de ingestão de PDFs
├── supabase/migrations/                   # Schema PostgreSQL
├── frontend/runtime_console_v3/src/
│   ├── app/judge/JudgePageClient.tsx      # Página principal Judge
│   ├── components/judge/                  # Componentes Judge
│   └── services/judgeApi.ts               # Cliente SSE + API
└── scripts/ingest_tcg.py                  # CLI de ingestão
```

**Stack:** FastAPI (Python) + Next.js 14 (TypeScript) + PostgreSQL/pgvector (Supabase) + Redis (Upstash) + OpenAI

**Deploy:** API no Render (`seekguidance.onrender.com`) | Frontend no Vercel (`judgetcg.com.br`)

Lê os arquivos mencionados antes de começar qualquer implementação. O projeto tem testes em:
- `services/api/tests/runtime_judge/` — testes pytest do Judge
- `frontend/runtime_console_v3/` — `npm run test` com Vitest

---

## Escopo desta tarefa

Implementa as 6 melhorias abaixo **na ordem indicada**, pois há dependências entre elas.
Cada epic tem: arquivos a ler, arquivos a modificar, implementação detalhada e testes.

---

## Epic 1 — Ativar índice HNSW em produção (sem downtime)

### Por que

A migration atual em `supabase/migrations/20260519000000_init_tcg_judge.sql` tem o índice
HNSW comentado. Com 12+ jogos indexados, a busca vetorial usa sequential scan — O(n).
Ativar resolve isso com impacto zero no código da API.

### Arquivos a ler

- `supabase/migrations/20260519000000_init_tcg_judge.sql` — ver estrutura atual da tabela `chunks`

### O que criar

Cria o arquivo `supabase/migrations/20260520000001_hnsw_index_chunks.sql`:

```sql
-- Migration: ativar índice HNSW na tabela chunks para busca vetorial eficiente
-- Usar CREATE INDEX CONCURRENTLY para não bloquear leitura em produção
-- m=16 e ef_construction=64: equilíbrio padrão recall/velocidade para corpus TCG
-- Rodar no Supabase Dashboard > SQL Editor ou via CLI supabase db push

BEGIN;

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  chunks_embedding_hnsw_idx
ON tcg_judge.chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Índice auxiliar para filtro por game_slug + busca vetorial (partition pruning manual)
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  chunks_game_slug_embedding_idx
ON tcg_judge.chunks (game_slug, (embedding::text))
WHERE embedding IS NOT NULL;

COMMENT ON INDEX tcg_judge.chunks_embedding_hnsw_idx IS
  'HNSW index para busca vetorial aproximada. Ativado em 20260520. '
  'Parâmetros: m=16 (conectividade), ef_construction=64 (qualidade na indexação). '
  'Para aumentar recall em produção, ajustar SET hnsw.ef_search = 100 por sessão.';

COMMIT;
```

### O que NÃO modificar

Não alteras a migration original. Esta migration nova é aditiva.

### Validação

Após aplicar, roda no SQL Editor do Supabase:
```sql
EXPLAIN ANALYZE
SELECT id, content, embedding <=> '[...1536 floats...]'::vector AS distance
FROM tcg_judge.chunks
WHERE game_slug = 'mtg'
ORDER BY distance
LIMIT 10;
```
O plano deve mostrar `Index Scan using chunks_embedding_hnsw_idx` e não `Seq Scan`.

---

## Epic 2 — Ativar e configurar o Reranker

### Por que

`RERANKER_ENABLED=false` por padrão. O reranker melhora o score `top1_fused` e a precisão
geral do retrieval, especialmente para jogos com corpus denso como MTG e Pokémon.

### Arquivos a ler

- `services/api/app/core/config.py` — ver como `RERANKER_ENABLED` é declarado
- `services/api/app/retrieval/confidence.py` — entender como `top1_fused` é calculado
- `services/api/app/retrieval/confidence_profiles.py` — perfis por jogo
- `services/api/app/application/rag_orchestrator.py` — onde o reranker é chamado

### Modificações

#### 1. `services/api/app/core/config.py`

Adiciona as variáveis de configuração do reranker (após as existentes de retrieval):

```python
# Reranker
RERANKER_ENABLED: bool = Field(default=False, env="RERANKER_ENABLED")
RERANKER_PROVIDER: str = Field(
    default="local",
    env="RERANKER_PROVIDER",
    description="'local' para BAAI/bge-reranker-large ou 'cohere' para Cohere Rerank API"
)
RERANKER_MODEL: str = Field(
    default="BAAI/bge-reranker-large",
    env="RERANKER_MODEL"
)
COHERE_API_KEY: Optional[str] = Field(default=None, env="COHERE_API_KEY")
RERANKER_TOP_K: int = Field(
    default=5,
    env="RERANKER_TOP_K",
    description="Número de chunks a manter após reranking"
)
```

#### 2. `services/api/app/retrieval/reranker.py` (arquivo novo)

Cria um módulo de reranker com suporte a dois providers:

```python
"""
Reranker abstrato para o pipeline RAG do Judge TCG.

Suporta dois providers:
- 'local': BAAI/bge-reranker-large via sentence-transformers (requer GPU ou CPU adequada)
- 'cohere': Cohere Rerank API (serverless, recomendado para Render sem GPU)

O reranker recebe a pergunta original e os chunks candidatos e retorna
os mesmos chunks reordenados por relevância cruzada (cross-encoder).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List, Optional

logger = logging.getLogger(__name__)


@dataclass
class RankedChunk:
    chunk: dict           # chunk original com todos os campos
    rerank_score: float   # score do reranker (0–1, maior = mais relevante)


class BaseReranker:
    async def rerank(self, query: str, chunks: List[dict], top_k: int) -> List[RankedChunk]:
        raise NotImplementedError


class LocalReranker(BaseReranker):
    """
    BAAI/bge-reranker-large via sentence-transformers.
    Carrega o modelo na primeira chamada e mantém em memória.
    Adequado para deploy com CPU dedicada ou GPU.
    """

    def __init__(self, model_name: str = "BAAI/bge-reranker-large"):
        self._model_name = model_name
        self._model = None  # lazy load

    def _load_model(self):
        if self._model is None:
            try:
                from sentence_transformers import CrossEncoder
                self._model = CrossEncoder(self._model_name)
                logger.info(f"Reranker '{self._model_name}' carregado com sucesso.")
            except ImportError:
                raise RuntimeError(
                    "sentence-transformers não instalado. "
                    "Adiciona 'sentence-transformers' ao requirements.txt "
                    "ou usa RERANKER_PROVIDER=cohere."
                )

    async def rerank(self, query: str, chunks: List[dict], top_k: int) -> List[RankedChunk]:
        self._load_model()
        pairs = [(query, chunk.get("content", "")) for chunk in chunks]

        import asyncio
        scores = await asyncio.get_event_loop().run_in_executor(
            None, self._model.predict, pairs
        )

        ranked = sorted(
            [RankedChunk(chunk=c, rerank_score=float(s)) for c, s in zip(chunks, scores)],
            key=lambda r: r.rerank_score,
            reverse=True
        )
        return ranked[:top_k]


class CohereReranker(BaseReranker):
    """
    Cohere Rerank API — sem GPU, serverless, ideal para Render.
    Requer COHERE_API_KEY no ambiente.
    Modelo recomendado: rerank-multilingual-v3.0 (suporta PT-BR nativamente).
    """

    def __init__(self, api_key: str, model: str = "rerank-multilingual-v3.0"):
        self._api_key = api_key
        self._model = model

    async def rerank(self, query: str, chunks: List[dict], top_k: int) -> List[RankedChunk]:
        try:
            import cohere
        except ImportError:
            raise RuntimeError("cohere não instalado. Adiciona 'cohere' ao requirements.txt.")

        import asyncio
        client = cohere.AsyncClient(self._api_key)

        documents = [chunk.get("content", "") for chunk in chunks]
        response = await client.rerank(
            query=query,
            documents=documents,
            model=self._model,
            top_n=top_k
        )

        ranked = []
        for result in response.results:
            ranked.append(RankedChunk(
                chunk=chunks[result.index],
                rerank_score=result.relevance_score
            ))
        return ranked


def get_reranker(provider: str, model: str, cohere_api_key: Optional[str] = None) -> BaseReranker:
    """Factory que retorna o reranker correto conforme configuração."""
    if provider == "cohere":
        if not cohere_api_key:
            raise ValueError("COHERE_API_KEY obrigatório quando RERANKER_PROVIDER=cohere")
        return CohereReranker(api_key=cohere_api_key, model=model)
    return LocalReranker(model_name=model)
```

#### 3. `services/api/app/application/rag_orchestrator.py`

Localiza o método `ask()` e integra o reranker após o retrieval híbrido.
Mantém a lógica existente — o reranker é uma etapa adicional condicional:

```python
# No __init__ do RagOrchestrator, adiciona:
from app.retrieval.reranker import get_reranker

if self.config.RERANKER_ENABLED:
    self._reranker = get_reranker(
        provider=self.config.RERANKER_PROVIDER,
        model=self.config.RERANKER_MODEL,
        cohere_api_key=self.config.COHERE_API_KEY,
    )
else:
    self._reranker = None

# No método ask(), após a etapa de retrieval híbrido e antes da montagem do contexto:
if self._reranker and retrieved_chunks:
    logger.debug(f"Reranking {len(retrieved_chunks)} chunks para query: {query[:60]}...")
    ranked = await self._reranker.rerank(
        query=question,
        chunks=retrieved_chunks,
        top_k=self.config.RERANKER_TOP_K,
    )
    retrieved_chunks = [r.chunk for r in ranked]
    # Propaga rerank_score para o sistema de confiança
    for chunk, r in zip(retrieved_chunks, ranked):
        chunk["rerank_score"] = r.rerank_score
```

#### 4. `services/api/app/retrieval/confidence.py`

Usa `rerank_score` quando disponível nos sinais de confiança:

```python
# Na função que calcula o score de confiança, adiciona:
rerank_scores = [c.get("rerank_score") for c in chunks if c.get("rerank_score") is not None]
if rerank_scores:
    signals["top1_rerank"] = rerank_scores[0]
    signals["avg_rerank"] = sum(rerank_scores) / len(rerank_scores)
```

### Requirements

Adiciona ao `services/api/requirements.txt` (comentado por default, ativar conforme provider):
```
# Reranker — descomentar conforme RERANKER_PROVIDER
# sentence-transformers>=2.7.0   # para RERANKER_PROVIDER=local
# cohere>=5.0.0                   # para RERANKER_PROVIDER=cohere (recomendado no Render)
```

### Variáveis de ambiente (Render)

```env
RERANKER_ENABLED=true
RERANKER_PROVIDER=cohere
COHERE_API_KEY=<chave_cohere>
RERANKER_TOP_K=5
```

### Testes

Cria `services/api/tests/retrieval/test_reranker.py`:
- Testa `CohereReranker` com mock da API Cohere (não faz chamada real)
- Verifica que chunks são reordenados pelo score
- Verifica que `top_k` limita o resultado
- Verifica fallback gracioso quando `RERANKER_ENABLED=false`

---

## Epic 3 — HyDE: Query Expansion Cross-lingual

### Por que

O Judge recebe perguntas em **PT-BR** mas o corpus de regras é majoritariamente em **EN**
(MTG Comprehensive Rules, Yu-Gi-Oh OCG, etc.). O embedding de uma pergunta PT tem baixo
overlap coseno com os chunks EN, reduzindo recall mesmo para regras corretas.

HyDE gera uma "resposta hipotética" na língua do corpus antes do retrieval vetorial,
aumentando o overlap semântico sem custo de re-ingestão.

### Arquivos a ler

- `services/api/app/application/rag_orchestrator.py` — método `ask()` completo
- `services/api/app/judge/registry.py` — ver campo `corpus_language` por jogo (ou adicionar)
- `services/api/app/core/config.py` — ver como OpenAI client é inicializado

### Modificações

#### 1. `services/api/app/judge/registry.py`

Adiciona campo `corpus_language` no registro de cada jogo:

```python
# No dicionário/dataclass de cada jogo, adicionar:
TCG_REGISTRY = {
    "mtg": {
        "slug": "mtg",
        "name": "Magic: The Gathering",
        "corpus_language": "en",   # <-- novo campo
        # ... campos existentes
    },
    "pokemon": {
        "slug": "pokemon",
        "name": "Pokémon TCG",
        "corpus_language": "en",
        # ...
    },
    "onepiece": {
        "slug": "onepiece",
        "name": "One Piece Card Game",
        "corpus_language": "en",
        # ...
    },
    # Para jogos com corpus PT, definir "pt" — HyDE é skip automático
    # "digimon": { "corpus_language": "pt", ... }
}
```

#### 2. `services/api/app/retrieval/hyde.py` (arquivo novo)

```python
"""
HyDE — Hypothetical Document Embeddings para query expansion cross-lingual.

Problema: perguntas em PT-BR têm baixo overlap coseno com chunks em EN,
reduzindo recall no retrieval vetorial.

Solução: gerar uma resposta hipotética na língua do corpus (EN) antes do
retrieval. O embedding da resposta hipotética tem muito mais overlap com
os chunks reais do que o embedding da pergunta original em PT.

Referência: Gao et al., 2022 — "Precise Zero-Shot Dense Retrieval without
Relevance Labels" (HyDE paper).

Custo: +1 chamada ao LLM (gpt-4o-mini). Estimativa: ~$0.0002/pergunta.
O recall cross-lingual melhora tipicamente 15–30% em corpora EN com queries PT.
"""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)

HYDE_SYSTEM_PROMPT = """You are a TCG (Trading Card Game) rules expert.
Given a question about {game_name} rules (which may be in Portuguese),
write a concise, factual answer in English as if it appeared in the official rulebook.
Use formal rules terminology. Do NOT invent rules — if unsure, write a plausible
but generic rules-document excerpt that covers the topic.
Limit to 3-4 sentences. No markdown. Plain text only."""

HYDE_USER_TEMPLATE = """Question: {question}

Write a short English rules excerpt that would answer this question:"""


async def generate_hypothetical_document(
    question: str,
    game_name: str,
    openai_client,        # AsyncOpenAI client já inicializado no orchestrator
    model: str = "gpt-4o-mini",
) -> Optional[str]:
    """
    Gera um documento hipotético em EN para uma pergunta (possivelmente em PT).
    Retorna None em caso de falha para não bloquear o pipeline principal.
    """
    try:
        response = await openai_client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": HYDE_SYSTEM_PROMPT.format(game_name=game_name)
                },
                {
                    "role": "user",
                    "content": HYDE_USER_TEMPLATE.format(question=question)
                }
            ],
            max_tokens=200,
            temperature=0.3,   # baixa temperatura: queremos texto factual, não criativo
        )
        hypothetical = response.choices[0].message.content.strip()
        logger.debug(f"HyDE gerou documento hipotético ({len(hypothetical)} chars)")
        return hypothetical
    except Exception as exc:
        logger.warning(f"HyDE falhou (não bloqueia pipeline): {exc}")
        return None
```

#### 3. `services/api/app/core/config.py`

```python
# HyDE — Query Expansion Cross-lingual
HYDE_ENABLED: bool = Field(default=True, env="HYDE_ENABLED")
HYDE_WEIGHT: float = Field(
    default=0.5,
    env="HYDE_WEIGHT",
    description="Peso do retrieval HyDE na fusão RRF (0=desabilitado, 1=só HyDE, 0.5=50/50)"
)
```

#### 4. `services/api/app/application/rag_orchestrator.py`

Integra HyDE no método `ask()` antes do retrieval vetorial.
A lógica deve ser: se o `corpus_language` do jogo for diferente da língua detectada
na pergunta (ou sempre que `corpus_language == "en"`), ativa HyDE:

```python
# Import no topo
from app.retrieval.hyde import generate_hypothetical_document

# No método ask(), ANTES do retrieval híbrido:
hypothetical_doc = None
if self.config.HYDE_ENABLED and game.get("corpus_language") == "en":
    hypothetical_doc = await generate_hypothetical_document(
        question=question,
        game_name=game["name"],
        openai_client=self._openai_client,
    )

# No retrieval vetorial, combina embeddings via RRF:
# 1. Retrieval com embedding da pergunta original (comportamento atual)
# 2. Retrieval com embedding do documento hipotético (novo — só se hypothetical_doc não é None)
# 3. Fusão RRF com peso HYDE_WEIGHT

if hypothetical_doc:
    hyde_embedding = await self._get_embedding(hypothetical_doc)
    hyde_chunks = await self._vector_search(
        embedding=hyde_embedding,
        game_slug=game_slug,
        limit=self.config.RETRIEVAL_TOP_K,
    )
    # Fusão RRF: combina original_chunks e hyde_chunks
    retrieved_chunks = self._rrf_merge(
        results_a=original_chunks,
        results_b=hyde_chunks,
        weight_b=self.config.HYDE_WEIGHT,
    )
else:
    retrieved_chunks = original_chunks
```

Implementa `_rrf_merge()` no orchestrator se ainda não existir:

```python
def _rrf_merge(
    self,
    results_a: list,
    results_b: list,
    weight_b: float = 0.5,
    k: int = 60
) -> list:
    """
    Reciprocal Rank Fusion com peso diferenciado.
    k=60 é o padrão da literatura (Cormack et al., 2009).
    weight_b permite dar mais ou menos peso ao retrieval HyDE.
    """
    scores: dict[str, float] = {}
    chunk_map: dict[str, dict] = {}

    for rank, chunk in enumerate(results_a):
        cid = str(chunk["id"])
        scores[cid] = scores.get(cid, 0.0) + (1.0 - weight_b) / (k + rank + 1)
        chunk_map[cid] = chunk

    for rank, chunk in enumerate(results_b):
        cid = str(chunk["id"])
        scores[cid] = scores.get(cid, 0.0) + weight_b / (k + rank + 1)
        chunk_map[cid] = chunk

    sorted_ids = sorted(scores, key=lambda x: scores[x], reverse=True)
    return [chunk_map[cid] for cid in sorted_ids]
```

### Variáveis de ambiente

```env
HYDE_ENABLED=true
HYDE_WEIGHT=0.5
```

### Testes

Cria `services/api/tests/retrieval/test_hyde.py`:
- Testa `generate_hypothetical_document` com mock do OpenAI client
- Verifica que retorna `None` (e não lança exceção) quando OpenAI falha
- Testa `_rrf_merge` com listas conhecidas e verifica ordenação
- Testa que HyDE é skip quando `corpus_language == "pt"`

---

## Epic 4 — Chunking Consciente de Hierarquia de Regras

### Por que

O chunking atual divide texto por contagem de tokens sem respeitar a estrutura dos
documentos de regras TCG. Regras como `702.9a` e `702.9b` (MTG) são sub-regras
da mesma mecânica ("702.9 Flying") e nunca devem ser separadas em chunks diferentes.
Dividir no meio de uma sub-regra garante que o retrieval recupere fragmentos incompletos.

### Arquivos a ler

- `services/ingestion/tcg_judge_ingestion/` — estrutura completa do módulo de ingestão
- `scripts/ingest_tcg.py` — CLI de ingestão (ver como chama o pipeline)
- `supabase/migrations/20260519000000_init_tcg_judge.sql` — colunas da tabela `chunks`

### Estrutura de regras TCG a suportar

```
MTG Comprehensive Rules:
  702.9.    Flying             ← regra pai
  702.9a.   A permanent...     ← sub-regra
  702.9b.   A creature...      ← sub-regra

Yu-Gi-Oh! Rulebook:
  Artigo 3. Mecânicas de turno
  3.1       Fase de compra
  3.1.1     O jogador ativo...

Pokémon TCG:
  Seção 4 — Dano e Ataques
  4-1       Calcular o dano...
  4-2       Aplicar condições...

Formato genérico (fallback):
  Chapter 5: Combat
  5.1 Attacks
  5.1.1 Ranged attacks...
```

### Migration de schema

Cria `supabase/migrations/20260520000002_chunks_hierarchy_fields.sql`:

```sql
-- Adiciona campos de hierarquia de regras à tabela chunks
-- Campos opcionais (nullable) — chunks de documentos sem estrutura numérica ficam NULL

ALTER TABLE tcg_judge.chunks
  ADD COLUMN IF NOT EXISTS rule_section TEXT,        -- ex: "702" ou "Artigo 3"
  ADD COLUMN IF NOT EXISTS rule_subsection TEXT,     -- ex: "702.9" ou "3.1"
  ADD COLUMN IF NOT EXISTS rule_atom TEXT,           -- ex: "702.9a" ou "3.1.1"
  ADD COLUMN IF NOT EXISTS rule_depth INT,           -- 0=capítulo, 1=seção, 2=sub-seção, 3=atômica
  ADD COLUMN IF NOT EXISTS rule_title TEXT,          -- ex: "Flying" (título da regra pai)
  ADD COLUMN IF NOT EXISTS parent_chunk_id UUID REFERENCES tcg_judge.chunks(id);
                                                     -- link para o chunk da regra pai

CREATE INDEX IF NOT EXISTS chunks_rule_section_idx
  ON tcg_judge.chunks (game_slug, rule_section)
  WHERE rule_section IS NOT NULL;

COMMENT ON COLUMN tcg_judge.chunks.rule_atom IS
  'Identificador atômico da regra (ex: 702.9a). Usado para links diretos nas fontes.';
COMMENT ON COLUMN tcg_judge.chunks.parent_chunk_id IS
  'Referência ao chunk da regra pai. Permite expansão hierárquica no retrieval.';
```

### Arquivos a criar/modificar

#### 1. `services/ingestion/tcg_judge_ingestion/chunking/rule_parser.py` (novo)

```python
"""
Parser de estrutura hierárquica para documentos de regras de TCGs.

Detecta padrões de numeração de regras em diferentes formatos de TCG
e produz chunks atômicos que preservam a hierarquia (pai → filho).

Formatos suportados:
- MTG CR: 702.9a, 702.9b, 100.1, etc.
- Yu-Gi-Oh / FAB / genérico: Artigo 3.1.2, Seção 4-1, etc.
- Pokémon / fallback: Chapter 5, 5-1, etc.

Retorna uma lista de RuleChunk com todos os metadados de hierarquia preenchidos.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

# ─── Padrões de detecção por jogo ───────────────────────────────────────────

# MTG: 702.9a, 100.1b, 903.10, etc.
MTG_RULE_RE = re.compile(
    r'^(?P<number>\d{3,4}(?:\.\d+[a-z]?))\s+(?P<text>.+)',
    re.MULTILINE
)

# Genérico numerado: "3.1.2", "Artigo 3.1", "Seção 4-1"
GENERIC_RULE_RE = re.compile(
    r'^(?:(?:Artigo|Seção|Section|Article|Chapter|Rule)\s+)?'
    r'(?P<number>\d+(?:[.\-]\d+)+[a-z]?)\s*[.:\-]?\s+(?P<text>.+)',
    re.MULTILINE | re.IGNORECASE
)

# Título de seção sem número: "CHAPTER 5: Combat", "4. ATTACKS"
SECTION_TITLE_RE = re.compile(
    r'^(?P<number>\d+)\.\s+(?P<title>[A-Z][A-Z\s]+)$',
    re.MULTILINE
)


@dataclass
class RuleChunk:
    content: str                      # texto completo do chunk
    rule_atom: Optional[str] = None   # identificador atômico (ex: "702.9a")
    rule_section: Optional[str] = None
    rule_subsection: Optional[str] = None
    rule_depth: int = 0
    rule_title: Optional[str] = None  # título da regra pai (ex: "Flying")
    parent_atom: Optional[str] = None # atom do chunk pai
    source_page: Optional[int] = None
    metadata: dict = field(default_factory=dict)


def _parse_mtg_number(number: str) -> Tuple[str, str, str, int]:
    """
    Decompõe um número MTG em (section, subsection, atom, depth).
    Ex: "702.9a" → ("702", "702.9", "702.9a", 2)
         "702.9"  → ("702", "702.9", "702.9", 1)
         "702"    → ("702", "702",   "702",   0)
    """
    parts = re.split(r'[.]', number)
    section = parts[0]
    if len(parts) == 1:
        return section, section, section, 0
    subsection = f"{parts[0]}.{re.sub(r'[a-z]$', '', parts[1])}"
    atom = number
    depth = 1 if not re.search(r'[a-z]$', number) else 2
    return section, subsection, atom, depth


def chunk_by_rule_hierarchy(
    text: str,
    game_slug: str,
    min_chunk_chars: int = 100,
    max_chunk_chars: int = 1200,
) -> List[RuleChunk]:
    """
    Divide o texto em chunks respeitando a hierarquia de regras.

    Estratégia:
    1. Detecta padrão de numeração prevalente no documento
    2. Agrupa linhas que pertencem à mesma regra atômica
    3. Se uma regra atômica for muito longa (> max_chunk_chars), divide por parágrafos
    4. Chunks muito curtos (< min_chunk_chars) são mesclados com o próximo

    Para documentos sem padrão numérico detectável, usa chunking por parágrafo
    com sobreposição de 1 parágrafo (fallback).
    """
    # Seleciona regex conforme jogo
    if game_slug == "mtg":
        rule_re = MTG_RULE_RE
        parse_number = _parse_mtg_number
    else:
        rule_re = GENERIC_RULE_RE
        parse_number = _parse_generic_number

    matches = list(rule_re.finditer(text))

    if len(matches) < 5:
        # Documento sem estrutura numérica detectável — fallback por parágrafo
        return _chunk_by_paragraph(text, max_chunk_chars)

    chunks: List[RuleChunk] = []
    # título da seção pai atual (para herdar nos chunks filhos)
    current_section_title: Optional[str] = None

    for i, match in enumerate(matches):
        number = match.group("number")
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        content = text[start:end].strip()

        if len(content) < min_chunk_chars and i + 1 < len(matches):
            # Chunk muito curto: será absorvido pelo próximo (handled no merge pass)
            pass

        section, subsection, atom, depth = parse_number(number)

        # Detecta título de seção (depth=0) para herdar nos filhos
        if depth == 0:
            title_match = SECTION_TITLE_RE.match(content.split('\n')[0])
            if title_match:
                current_section_title = title_match.group("title").title()

        chunk = RuleChunk(
            content=content[:max_chunk_chars],  # nunca exceder max
            rule_atom=atom,
            rule_section=section,
            rule_subsection=subsection,
            rule_depth=depth,
            rule_title=current_section_title,
            parent_atom=subsection if depth == 2 else (section if depth == 1 else None),
        )
        chunks.append(chunk)

    return _merge_short_chunks(chunks, min_chunk_chars)


def _parse_generic_number(number: str) -> Tuple[str, str, str, int]:
    """Fallback para formatos genéricos (Artigo 3.1.2, Seção 4-1, etc.)"""
    clean = re.sub(r'[^0-9.]', '.', number).strip('.')
    parts = [p for p in clean.split('.') if p]
    depth = min(len(parts) - 1, 3)
    section = parts[0] if parts else number
    subsection = '.'.join(parts[:2]) if len(parts) >= 2 else section
    return section, subsection, number, depth


def _chunk_by_paragraph(text: str, max_chars: int) -> List[RuleChunk]:
    """Fallback: divide por parágrafos duplos com sobreposição de 1 parágrafo."""
    paragraphs = [p.strip() for p in re.split(r'\n\n+', text) if p.strip()]
    chunks = []
    buffer = ""
    for i, para in enumerate(paragraphs):
        if len(buffer) + len(para) > max_chars and buffer:
            chunks.append(RuleChunk(content=buffer.strip()))
            # sobreposição: mantém o último parágrafo
            buffer = paragraphs[i - 1] + "\n\n" if i > 0 else ""
        buffer += para + "\n\n"
    if buffer.strip():
        chunks.append(RuleChunk(content=buffer.strip()))
    return chunks


def _merge_short_chunks(chunks: List[RuleChunk], min_chars: int) -> List[RuleChunk]:
    """Mescla chunks muito curtos com o seguinte da mesma subsecção."""
    if not chunks:
        return chunks
    result = [chunks[0]]
    for chunk in chunks[1:]:
        prev = result[-1]
        same_parent = prev.rule_subsection == chunk.rule_subsection
        prev_short = len(prev.content) < min_chars
        if prev_short and same_parent:
            result[-1] = RuleChunk(
                content=prev.content + "\n" + chunk.content,
                rule_atom=chunk.rule_atom,    # atom do filho mais recente
                rule_section=prev.rule_section,
                rule_subsection=prev.rule_subsection,
                rule_depth=prev.rule_depth,
                rule_title=prev.rule_title,
                parent_atom=prev.parent_atom,
            )
        else:
            result.append(chunk)
    return result
```

#### 2. Integrar no pipeline de ingestão

No arquivo principal de chunking da ingestão (identifica qual é lendo a pasta
`services/ingestion/tcg_judge_ingestion/`), substitui a chamada de chunking atual
por `chunk_by_rule_hierarchy` quando o jogo tem corpus estruturado.

Adiciona os novos campos ao payload de inserção no banco:
```python
{
    "content": chunk.content,
    "rule_path": chunk.rule_atom,        # campo existente
    "rule_section": chunk.rule_section,  # novo
    "rule_subsection": chunk.rule_subsection, # novo
    "rule_atom": chunk.rule_atom,        # novo (redundante com rule_path por compatibilidade)
    "rule_depth": chunk.rule_depth,      # novo
    "rule_title": chunk.rule_title,      # novo
    # parent_chunk_id requer segundo pass após inserção dos pais — implementar se viável
}
```

### Testes

Cria `services/api/tests/ingestion/test_rule_parser.py`:
- Testa `chunk_by_rule_hierarchy` com texto MTG CR real (10 regras) — verifica que 702.9a e 702.9b ficam em chunks separados mas com mesmo `rule_subsection`
- Testa fallback por parágrafo para texto sem numeração
- Testa `_merge_short_chunks` com chunks < `min_chunk_chars`
- Verifica que nenhum chunk excede `max_chunk_chars`

---

## Epic 5 — Endpoint de Feedback + Frontend 👍 / 👎

### Arquivos a ler

- `services/api/app/api/v1/runtime_judge.py` — adicionar novo endpoint aqui
- `supabase/migrations/20260519000000_init_tcg_judge.sql` — ver schema de `retrieval_feedback`
- `frontend/runtime_console_v3/src/components/judge/` — ver componentes existentes
- `frontend/runtime_console_v3/src/services/judgeApi.ts` — adicionar chamada de feedback

### Backend

#### `services/api/app/api/v1/runtime_judge.py`

Adiciona endpoint de feedback após os endpoints existentes:

```python
from pydantic import BaseModel, Field
from typing import Literal, Optional

class JudgeFeedbackRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=500)
    game_slug: str
    verdict: Optional[str] = None        # "Permitido", "Não permitido", etc.
    rating: Literal["positive", "negative"]
    comment: Optional[str] = Field(None, max_length=500)
    # IDs para rastreabilidade (opcionais — frontend pode não ter)
    question_embedding_hash: Optional[str] = None
    chunk_ids: Optional[list[str]] = None


@router.post("/runtime/judge/feedback", status_code=202)
async def submit_judge_feedback(
    payload: JudgeFeedbackRequest,
    db=Depends(get_db),
    rate_limiter=Depends(get_rate_limiter("judge")),
):
    """
    Grava feedback do utilizador sobre uma resposta do Judge.
    Status 202 (Accepted) — operação assíncrona, não bloqueia o utilizador.
    """
    await db.execute(
        """
        INSERT INTO tcg_judge.retrieval_feedback
          (game_slug, question, verdict, rating, comment, chunk_ids, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        """,
        payload.game_slug,
        payload.question,
        payload.verdict,
        payload.rating,
        payload.comment,
        payload.chunk_ids or [],
    )
    return {"status": "accepted"}
```

### Frontend

#### `frontend/runtime_console_v3/src/services/judgeApi.ts`

Adiciona função de feedback ao lado das existentes:

```typescript
export interface JudgeFeedbackPayload {
  question: string;
  game_slug: string;
  verdict?: string;
  rating: "positive" | "negative";
  comment?: string;
}

export async function submitJudgeFeedback(
  payload: JudgeFeedbackPayload
): Promise<void> {
  await fetch("/api/proxy/runtime/judge/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  // Silencia erros — feedback é best-effort, nunca bloqueia UX
}
```

#### `frontend/runtime_console_v3/src/components/judge/FeedbackButtons.tsx` (novo)

```tsx
"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { submitJudgeFeedback, JudgeFeedbackPayload } from "@/services/judgeApi";

interface FeedbackButtonsProps {
  question: string;
  gameSlug: string;
  verdict?: string;
}

type FeedbackState = "idle" | "positive" | "negative" | "submitted";

export function FeedbackButtons({ question, gameSlug, verdict }: FeedbackButtonsProps) {
  const [state, setState] = useState<FeedbackState>("idle");
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);

  const handleRating = async (rating: "positive" | "negative") => {
    setState(rating);
    setShowComment(rating === "negative"); // solicita comentário só no negativo

    const payload: JudgeFeedbackPayload = {
      question,
      game_slug: gameSlug,
      verdict,
      rating,
    };

    // Submit imediato (otimista) — comentário adicional se houver
    await submitJudgeFeedback(payload);

    if (rating === "positive") {
      setState("submitted");
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) {
      setState("submitted");
      return;
    }
    await submitJudgeFeedback({
      question,
      game_slug: gameSlug,
      verdict,
      rating: "negative",
      comment,
    });
    setState("submitted");
    setShowComment(false);
  };

  if (state === "submitted") {
    return (
      <p className="text-xs text-muted-foreground mt-2">
        Obrigado pelo feedback!
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Esta resposta foi útil?</span>
        <button
          onClick={() => handleRating("positive")}
          disabled={state !== "idle"}
          aria-label="Resposta útil"
          className={`p-1.5 rounded-md border transition-colors ${
            state === "positive"
              ? "bg-green-50 border-green-300 text-green-600"
              : "border-border text-muted-foreground hover:border-green-300 hover:text-green-600"
          }`}
        >
          <ThumbsUp size={14} />
        </button>
        <button
          onClick={() => handleRating("negative")}
          disabled={state !== "idle"}
          aria-label="Resposta não útil"
          className={`p-1.5 rounded-md border transition-colors ${
            state === "negative"
              ? "bg-red-50 border-red-300 text-red-600"
              : "border-border text-muted-foreground hover:border-red-300 hover:text-red-600"
          }`}
        >
          <ThumbsDown size={14} />
        </button>
      </div>

      {showComment && (
        <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
            placeholder="O que estava errado? (opcional)"
            maxLength={500}
            className="flex-1 text-xs px-2 py-1.5 rounded-md border border-border bg-background"
            autoFocus
          />
          <button
            onClick={handleCommentSubmit}
            className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
          >
            Enviar
          </button>
        </div>
      )}
    </div>
  );
}
```

#### `frontend/runtime_console_v3/src/components/judge/ResponseCard.tsx`

Adiciona `<FeedbackButtons>` ao final do card de resposta, passando `question`,
`gameSlug` e `verdict` que já estão disponíveis nas props do componente.

---

## Epic 6 — UX de Streaming com Fases Visíveis

### Por que

Entre o envio da pergunta e o primeiro token SSE há silêncio. Com o reranker e HyDE,
essa latência aumenta. Mostrar as fases reais do pipeline transforma espera em
informação e reduz percepção de lentidão.

### Arquivos a ler

- `services/api/app/api/v1/runtime_judge.py` — endpoint `/query/stream`
- `frontend/runtime_console_v3/src/services/judgeApi.ts` — consumo do SSE
- `frontend/runtime_console_v3/src/app/judge/JudgePageClient.tsx` — estado do streaming

### Backend — Adicionar eventos de fase no SSE

No endpoint `POST /runtime/judge/query/stream`, antes de enviar os tokens do LLM,
envia eventos SSE de fase:

```python
# Tipo de evento SSE de fase (adicionar ao protocolo existente)
# Formato: {"type": "phase", "phase": "retrieving", "label": "Buscando regras de Magic..."}

async def stream_judge_response(request, game_name: str):
    """
    Protocolo SSE do Judge:
    1. {"type": "phase", "phase": "embedding",   "label": "Analisando a pergunta..."}
    2. {"type": "phase", "phase": "retrieving",  "label": "Buscando regras de {game}..."}
    3. {"type": "phase", "phase": "reranking",   "label": "Verificando fontes oficiais..."}
       (só se RERANKER_ENABLED=true)
    4. {"type": "phase", "phase": "generating",  "label": "Gerando veredito..."}
    5. {"type": "token", "token": "..."} × N     (tokens do LLM em stream)
    6. {"type": "done",  "verdict": {...}}        (payload final — comportamento atual)
    """
    yield f"data: {json.dumps({'type': 'phase', 'phase': 'embedding', 'label': 'Analisando a pergunta...'})}\n\n"

    # ... embedding ...

    yield f"data: {json.dumps({'type': 'phase', 'phase': 'retrieving', 'label': f'Buscando regras de {game_name}...'})}\n\n"

    # ... retrieval híbrido + HyDE ...

    if config.RERANKER_ENABLED:
        yield f"data: {json.dumps({'type': 'phase', 'phase': 'reranking', 'label': 'Verificando fontes oficiais...'})}\n\n"
        # ... reranking ...

    yield f"data: {json.dumps({'type': 'phase', 'phase': 'generating', 'label': 'Gerando veredito...'})}\n\n"

    # ... stream tokens do LLM (comportamento atual) ...
```

### Frontend — Consumir fases e exibir indicador

#### `frontend/runtime_console_v3/src/services/judgeApi.ts`

No handler do SSE (`askJudgeQuestionStream`), adiciona suporte ao evento `phase`:

```typescript
// Tipo existente de evento SSE — adicionar:
export interface JudgePhaseEvent {
  type: "phase";
  phase: "embedding" | "retrieving" | "reranking" | "generating";
  label: string;
}

// No loop de leitura do SSE, antes do handler de "token":
if (parsed.type === "phase") {
  onPhase?.(parsed as JudgePhaseEvent); // callback opcional
  continue;
}
```

#### `frontend/runtime_console_v3/src/components/judge/StreamingIndicator.tsx` (novo)

```tsx
"use client";

interface StreamingIndicatorProps {
  phase: string | null;   // label da fase atual ou null quando não está streamando
}

const PHASE_ICONS: Record<string, string> = {
  embedding:  "🔍",
  retrieving: "📚",
  reranking:  "⚖️",
  generating: "✍️",
};

export function StreamingIndicator({ phase }: StreamingIndicatorProps) {
  if (!phase) return null;

  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted/50 border border-border/50 animate-in fade-in duration-200">
      <span className="text-sm" aria-hidden>
        {/* Ícone baseado na fase — fallback para spinner genérico */}
        {Object.entries(PHASE_ICONS).find(([k]) => phase.toLowerCase().includes(k))?.[1] ?? "⏳"}
      </span>
      <span className="text-xs text-muted-foreground">{phase}</span>
      {/* Três pontos animados */}
      <span className="flex gap-0.5 ml-auto" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
```

#### `frontend/runtime_console_v3/src/app/judge/JudgePageClient.tsx`

- Adiciona estado `currentPhase: string | null`
- Passa `onPhase` para `askJudgeQuestionStream` que atualiza `currentPhase`
- Renderiza `<StreamingIndicator phase={currentPhase} />` acima do `ResponseCard` durante streaming
- Limpa `currentPhase` quando recebe evento `done`

---

## Ordem de execução e commits sugeridos

```
1. feat(db): migration HNSW index e campos de hierarquia de chunks
   → Epics 1 e 4 (migration)

2. feat(ingestion): chunking hierárquico de regras por game_slug
   → Epic 4 (rule_parser.py + integração)

3. feat(retrieval): reranker abstrato com providers local e Cohere
   → Epic 2

4. feat(retrieval): HyDE query expansion cross-lingual
   → Epic 3

5. feat(api): endpoint POST /runtime/judge/feedback
   → Epic 5 (backend)

6. feat(judge): UX streaming com fases visíveis via SSE
   → Epic 6 (backend SSE + frontend)

7. feat(judge): componente FeedbackButtons 👍/👎
   → Epic 5 (frontend)

8. test: cobertura para reranker, HyDE, rule_parser e feedback
   → Todos os testes listados nos epics
```

## Restrições importantes

- **NÃO** alteres o contrato JSON do endpoint `POST /runtime/judge/query` — apenas adiciona campos opcionais
- **NÃO** remove o modo síncrono (`/query` sem `/stream`) — deve continuar funcionando
- **NÃO** commitas arquivos em `services/api/generated/`, `var/`, `*.pem` ou `.env`
- Qualquer mudança no schema Supabase deve ser uma **migration nova** em `supabase/migrations/` — nunca alterar migrations existentes
- Mantém compatibilidade com `RERANKER_ENABLED=false` e `HYDE_ENABLED=false` — o pipeline deve funcionar idêntico ao atual quando ambos estão desativados
- Testa localmente com `pytest tests/core/test_security.py tests/runtime_judge -q` antes de abrir PR
