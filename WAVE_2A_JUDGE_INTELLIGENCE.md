# Cursor Prompt — Wave 2A: Judge Intelligence Quality

## Contexto do projeto

**Judge TCG** (`judgetcg.com.br`) — assistente de regras para Trading Card Games.

Stack: FastAPI (Python) + Next.js 14 (TypeScript) + PostgreSQL/pgvector (Supabase) + Redis (Upstash) + OpenAI.

Epics já implementados (não tocar):
- Epic 1–6 da Wave 1: HNSW, Reranker (Cohere), HyDE, Chunking hierárquico, Feedback 👍/👎, SSE com fases.

Estrutura crítica do monorepo:
```
tcg-judge/
├── services/api/app/
│   ├── api/v1/runtime_judge.py
│   ├── application/rag_orchestrator.py
│   ├── retrieval/
│   │   ├── confidence.py
│   │   ├── confidence_profiles.py
│   │   ├── fusion.py
│   │   ├── hyde.py
│   │   └── rerank.py
│   ├── judge/
│   │   ├── registry.py
│   │   └── prompts/              # pode não existir ainda
│   └── core/config.py
├── services/ingestion/tcg_judge_ingestion/
│   └── chunking/rule_parser.py
├── supabase/migrations/
├── frontend/runtime_console_v3/src/
│   ├── app/judge/JudgePageClient.tsx
│   └── components/judge/
├── .github/workflows/
└── tests/
    ├── retrieval/
    └── judge_quality/            # pode não existir ainda
```

Lê **todos** os arquivos mencionados antes de escrever qualquer código.

---

## Restrições globais

- NÃO criar novos domínios arquiteturais ("civilization", "cognitive", "meta-runtime").
- NÃO alterar migrations existentes — criar novas em `supabase/migrations/`.
- NÃO quebrar o contrato JSON de endpoints existentes — só adicionar campos opcionais.
- Manter `RERANKER_ENABLED=false` e `HYDE_ENABLED=false` funcionando idêntico ao comportamento anterior.
- stdlib-first: preferir biblioteca padrão antes de adicionar dependências.
- Degradação graciosa: cada componente novo deve funcionar mesmo com Redis indisponível.
- Todos os novos componentes precisam de testes, docstring e observabilidade.

---

## Epic 1 — CI de avaliação automatizado

### Problema

Os datasets `tests/judge_quality/judge_grade_v3/` e `judge_grade_v4/` existem mas não rodam em CI. Mudanças em `retrieval/`, `rag_orchestrator.py`, `config.py`, reranker, HyDE ou chunking podem degradar qualidade sem detecção.

### Arquivos a ler antes de implementar

- `tests/judge_quality/` — estrutura atual dos datasets
- `.github/workflows/` — workflows existentes para não duplicar steps
- `services/api/app/core/config.py` — como `RERANKER_ENABLED` e `HYDE_ENABLED` são declarados

### Criar: `.github/workflows/judge-evaluation.yml`

O workflow deve:

**Trigger:** Push ou PR que modifique arquivos em:
```
services/api/app/retrieval/**
services/api/app/judge/**
services/api/app/application/rag_orchestrator.py
services/api/app/core/config.py
services/api/app/judge/prompts/**
services/ingestion/**
tests/judge_quality/**
```

**Pré-condição obrigatória — verificar corpus antes de avaliar:**

Antes de rodar os datasets, consultar o status de ingestão de cada jogo:
```python
# scripts/ci/check_corpus_readiness.py
# Para cada game_slug nos datasets:
#   GET /runtime/judge/{game_slug}/status
#   Se rag_ready=false OU ingestion_job_pending=true:
#     marcar jogo como SKIP_EVAL
#     logar: "Skipping {game} — reindexing in progress"
# Exportar EVAL_SKIP_GAMES como env var para o step seguinte
```

Isso evita falsos negativos durante janelas de re-ingestão após mudanças de chunking.

**Calcular métricas por jogo:**

```python
# scripts/ci/run_judge_eval.py
# Para cada sample nos datasets (exceto jogos em EVAL_SKIP_GAMES):
#   POST /runtime/judge/query com a pergunta do dataset
#   Comparar resposta com ground truth
#   Calcular:
#     accuracy@1: resposta menciona a regra correta (rule_atom esperado)
#     confidence_avg: média do campo confidence na resposta
#     source_coverage: % de rule_atoms esperados presentes nas fontes retornadas
```

**Gates de qualidade:**

Bloquear merge (exit code != 0) quando, para qualquer jogo com corpus indexado (não em SKIP):
- `accuracy@1` cair mais de 5% vs baseline armazenado em `tests/judge_quality/baseline.json`
- `confidence_avg` cair abaixo de `0.55`

Atualizar `baseline.json` automaticamente quando o PR for mergeado na branch principal.

**Relatório automático no PR:**

Usar GitHub Actions `actions/github-script` para publicar comentário:

```markdown
## Judge Evaluation — Wave 2A CI

| Jogo    | Baseline acc@1 | Atual acc@1 | Delta  | Status |
|---------|----------------|-------------|--------|--------|
| mtg     | 0.86           | 0.84        | -2.3%  | ✅     |
| pokemon | 0.79           | 0.81        | +2.5%  | ✅     |
| yugioh  | SKIP           | SKIP        | —      | ⏭ reindexing |

confidence_avg: mtg=0.71, pokemon=0.68
```

### Testes

Criar `tests/ci/test_eval_pipeline.py`:
- Testa `check_corpus_readiness.py` com mock de API retornando `rag_ready=false`
- Verifica que jogos com corpus pendente são excluídos dos gates
- Testa cálculo de `accuracy@1` com respostas sintéticas conhecidas

---

## Epic 2 — Source cards ricos com rule_atom

### Problema

Os campos `rule_atom`, `rule_section` e `page_number` já existem no schema após a Epic 4 da Wave 1. O frontend não os exibe ainda — zero mudança de backend necessária.

### Arquivos a ler

- `frontend/runtime_console_v3/src/components/judge/SourceCard.tsx` — componente atual
- `frontend/runtime_console_v3/src/services/judgeApi.ts` — tipo `JudgeSource`
- `frontend/runtime_console_v3/src/utils/highlight-excerpt.ts` — reutilizar aqui

### Modificar: tipo `JudgeSource` em `judgeApi.ts`

Adicionar campos opcionais (não breaking):
```typescript
export interface JudgeSource {
  // campos existentes...
  rule_atom?: string;       // ex: "702.9a"
  rule_section?: string;    // ex: "702"
  rule_title?: string;      // ex: "Flying"
  rule_depth?: number;      // 0=capítulo, 1=seção, 2=sub-regra
  source_type?: "official" | "faq" | "errata" | "local_document";
  page_number?: number;
  url?: string;
}
```

### Modificar: `SourceCard.tsx`

Adicionar os seguintes elementos visuais, em ordem, abaixo do título atual:

**1. Rule pill clicável**

Se `rule_atom` existir, exibir como pill (`<code>`) com tooltip que mostra `rule_title` e o excerpt do chunk. Clicar no pill copia o `rule_atom` para o clipboard.

**2. Deep link para página do PDF**

Se `url` e `page_number` existirem, o link "Abrir fonte" deve apontar para `{url}#page={page_number}`.

**3. Badge de tipo da fonte**

Mapeamento de cores:
- `official` → badge verde ("Regra Oficial")
- `faq` → badge azul ("FAQ Oficial")
- `errata` → badge âmbar ("Errata")
- `local_document` → badge cinza ("Documento Local")

**4. Expandir trecho completo**

Botão "Ver trecho completo" que usa `highlight-excerpt.ts` existente para exibir o texto do chunk com a keyword da pergunta destacada. Colapsar/expandir com animação de altura.

### Testes (Vitest)

Criar `tests/components/SourceCard.test.tsx`:
- Renderiza sem `rule_atom` (backwards compat)
- Renderiza pill com tooltip quando `rule_atom` presente
- Link correto com `#page=N` quando `page_number` presente
- Badge correto para cada `source_type`

---

## Epic 3 — Cache semântico Redis

### Problema

HyDE + reranker aumentaram a latência. Perguntas recorrentes por jogo ("o que é trample?") são reprocessadas desnecessariamente.

### Decisão de design — evitar bloqueante técnico

O Redis padrão **não suporta** busca por similaridade vetorial nativamente. Escanear todos os embeddings do `game_slug` em memória é O(n) e inviável em produção.

**Arquitetura em dois níveis:**

**Nível 1 — Hash exato (default, zero dependência extra):**
- Normalizar o texto da pergunta: lowercase + strip punctuation + sort words
- Hash SHA-256 do texto normalizado
- Chave: `tcg:cache:{game_slug}:{model_slug}:{text_hash}`
- Hit imediato sem comparação vetorial

**Nível 2 — Similaridade vetorial (upgrade opcional via `SEMANTIC_CACHE_PROVIDER=redis_stack`):**
- Requer Redis Stack com módulo RediSearch
- Criar índice vetorial por `game_slug` no startup
- Threshold configurável via `SEMANTIC_CACHE_SIMILARITY_THRESHOLD` (default: `0.97`)

### Arquivos a ler

- `services/api/app/core/config.py`
- `services/api/app/application/rag_orchestrator.py`

### Novas variáveis em `config.py`

```python
SEMANTIC_CACHE_ENABLED: bool = Field(default=False, env="SEMANTIC_CACHE_ENABLED")
SEMANTIC_CACHE_PROVIDER: str = Field(
    default="hash",
    env="SEMANTIC_CACHE_PROVIDER",
    description="'hash' (default) ou 'redis_stack' (requer Redis Stack com RediSearch)"
)
SEMANTIC_CACHE_TTL_SECONDS: int = Field(default=86400, env="SEMANTIC_CACHE_TTL_SECONDS")
SEMANTIC_CACHE_SIMILARITY_THRESHOLD: float = Field(
    default=0.97,
    env="SEMANTIC_CACHE_SIMILARITY_THRESHOLD",
    description="Usado apenas quando SEMANTIC_CACHE_PROVIDER=redis_stack"
)
```

### Criar: `services/api/app/retrieval/semantic_cache.py`

```python
"""
Cache semântico para o pipeline RAG do Judge TCG.

Dois providers:
- 'hash': cache por hash exato do texto normalizado (default).
  Zero dependência extra. Redis padrão. Funciona com qualquer deployment.
  Cache hit: pergunta idêntica (normalizada) já foi respondida.

- 'redis_stack': cache por similaridade vetorial via RediSearch.
  Requer Redis Stack. Cache hit: pergunta semanticamente equivalente.
  Threshold configurável. Upgrade opcional para alta volumetria.

A chave sempre inclui o model_slug para invalidação automática
após upgrade do modelo de embedding.
"""

import hashlib
import re
import logging
from typing import Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

def _normalize_question(text: str) -> str:
    """Normaliza pergunta para hash determinístico."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    words = sorted(text.split())
    return ' '.join(words)

def _model_slug(model_name: str) -> str:
    """8 chars do hash do nome do modelo — versiona a chave."""
    return hashlib.sha256(model_name.encode()).hexdigest()[:8]

def _cache_key(game_slug: str, model_name: str, text: str) -> str:
    text_hash = hashlib.sha256(_normalize_question(text).encode()).hexdigest()[:16]
    slug = _model_slug(model_name)
    return f"tcg:cache:{game_slug}:{slug}:{text_hash}"

async def get_cached_response(
    redis_client,
    game_slug: str,
    question: str,
    model_name: str,
) -> Optional[Any]:
    """
    Tenta recuperar resposta do cache.
    Retorna None em caso de miss ou quando Redis indisponível (degradação graciosa).
    """
    if not settings.SEMANTIC_CACHE_ENABLED or redis_client is None:
        return None
    try:
        key = _cache_key(game_slug, model_name, question)
        value = await redis_client.get(key)
        if value:
            logger.debug(f"Cache hit: {game_slug}/{key[-8:]}")
            import json
            return json.loads(value)
        return None
    except Exception as exc:
        logger.warning(f"Cache get falhou (degradação graciosa): {exc}")
        return None

async def set_cached_response(
    redis_client,
    game_slug: str,
    question: str,
    model_name: str,
    response: Any,
) -> None:
    """Armazena resposta no cache. Falha silenciosamente."""
    if not settings.SEMANTIC_CACHE_ENABLED or redis_client is None:
        return
    try:
        key = _cache_key(game_slug, model_name, question)
        import json
        await redis_client.set(key, json.dumps(response), ex=settings.SEMANTIC_CACHE_TTL_SECONDS)
    except Exception as exc:
        logger.warning(f"Cache set falhou (degradação graciosa): {exc}")

async def invalidate_game_cache(redis_client, game_slug: str, model_name: str) -> int:
    """
    Invalida todo o cache de um jogo após nova ingestão.
    Retorna o número de chaves deletadas.
    """
    if redis_client is None:
        return 0
    try:
        pattern = f"tcg:cache:{game_slug}:{_model_slug(model_name)}:*"
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)
            logger.info(f"Cache invalidado: {len(keys)} chaves para {game_slug}")
            return len(keys)
        return 0
    except Exception as exc:
        logger.warning(f"Cache invalidation falhou: {exc}")
        return 0
```

### Integrar no `rag_orchestrator.py`

No início do método `ask()`, antes de qualquer processamento:

```python
# Tentar cache antes de qualquer LLM call
cached = await get_cached_response(
    redis_client=self._redis,
    game_slug=game_slug,
    question=question,
    model_name=self.config.OPENAI_EMBEDDING_MODEL,
)
if cached:
    # Adicionar flag para métricas
    cached["cache_hit"] = True
    return cached

# ... pipeline normal ...

# Ao final, após montar a resposta completa:
await set_cached_response(
    redis_client=self._redis,
    game_slug=game_slug,
    question=question,
    model_name=self.config.OPENAI_EMBEDDING_MODEL,
    response=response_payload,
)
```

### Invalidação automática após ingestão

No pipeline de ingestão, ao completar a indexação de um jogo:
```python
invalidated = await invalidate_game_cache(redis_client, game_slug, settings.OPENAI_EMBEDDING_MODEL)
logger.info(f"Ingestão completa. Cache invalidado: {invalidated} chaves para {game_slug}")
```

### Métrica no endpoint `/runtime/judge/health`

Adicionar ao payload de health:
```json
{
  "semantic_cache": {
    "enabled": true,
    "provider": "hash",
    "hit_rate_1h": 0.34
  }
}
```

### Testes

Criar `tests/retrieval/test_semantic_cache.py`:
- Testa `_normalize_question`: "Como funciona Trample?" == "Como funciona Trample" (pontuação stripped)
- Testa que palavras reordenadas **não** geram cache hit (hash é de texto normalizado, não de bag-of-words)
- Testa que modelo diferente gera chave diferente (não polui cache após upgrade)
- Testa que Redis indisponível retorna `None` sem lançar exceção
- Testa invalidação: após `invalidate_game_cache`, `get_cached_response` retorna `None`

---

## Epic 4 — Auto-geração de rule_graph_edges

### Problema

As arestas entre regras relacionadas são criadas manualmente. Para documentos extensos como o MTG CR (250+ páginas), a cobertura é inevitavelmente incompleta.

### Criar: `services/api/app/jobs/rule_graph_builder.py`

```python
"""
Job de auto-geração de rule_graph_edges para o Judge TCG.

Executa após ingestão hierárquica (Epic 4 Wave 1) e extrai referências
cruzadas entre chunks usando LLM + regex.

Tipos de aresta:
- references: "Ver regra 702.9a", "See rule 603"
- supersedes: errata que atualiza regra anterior
- exception_to: "Exceto quando descrito em 614", "Exception to rule 602"
- example_of: "Por exemplo" seguido de referência a regra

Prevenção de ciclos:
- MAX_EDGE_DEPTH: profundidade máxima de travessia no retrieval
- Visited set por sessão de retrieval (implementado no retrieval, não aqui)
- Rejeitar arestas A→B onde B→A já existe com tipo incompatível

Persistência:
- Cada aresta tem campo confidence (0.0–1.0)
- Arestas com confidence < EDGE_CONFIDENCE_THRESHOLD são ignoradas no retrieval
- Arestas geradas automaticamente têm source="auto_generated"
  (distinguidas de arestas manuais: source="manual")
"""

import re
import logging
from dataclasses import dataclass
from typing import List, Optional, Literal
from app.core.config import settings

logger = logging.getLogger(__name__)

EdgeType = Literal["references", "supersedes", "exception_to", "example_of"]

@dataclass
class RuleEdge:
    source_chunk_id: str
    target_rule_atom: str          # atom do chunk destino (ex: "702.9a")
    edge_type: EdgeType
    confidence: float              # 0.0–1.0
    extracted_text: str            # trecho que gerou a aresta (para auditoria)
    source: str = "auto_generated"

# Padrões regex por tipo de aresta
EDGE_PATTERNS: dict[EdgeType, list[str]] = {
    "references": [
        r'[Ss]ee rule (\d{3}(?:\.\d+[a-z]?)?)',
        r'[Vv]er regra (\d{3}(?:\.\d+[a-z]?)?)',
        r'[Rr]efer(?:ence)? to rule (\d{3}(?:\.\d+[a-z]?)?)',
        r'[Cc]onforme regra (\d{3}(?:\.\d+[a-z]?)?)',
    ],
    "exception_to": [
        r'[Ee]xcept(?:ion)? (?:as )?(?:described in|to) rule (\d{3}(?:\.\d+[a-z]?)?)',
        r'[Ee]xceto (?:conforme )?regra (\d{3}(?:\.\d+[a-z]?)?)',
    ],
    "example_of": [
        r'[Ee]xample[s]? of rule (\d{3}(?:\.\d+[a-z]?)?)',
        r'[Ee]xemplo de regra (\d{3}(?:\.\d+[a-z]?)?)',
    ],
}

def extract_edges_from_chunk(chunk_id: str, content: str, rule_atom: str) -> List[RuleEdge]:
    """Extrai arestas de um chunk via regex. Alta precisão, sem custo de LLM."""
    edges = []
    for edge_type, patterns in EDGE_PATTERNS.items():
        for pattern in patterns:
            for match in re.finditer(pattern, content):
                target = match.group(1)
                if target == rule_atom:
                    continue  # ignorar auto-referência
                edges.append(RuleEdge(
                    source_chunk_id=chunk_id,
                    target_rule_atom=target,
                    edge_type=edge_type,
                    confidence=0.85,  # regex match tem alta confiança
                    extracted_text=match.group(0),
                ))
    return edges

async def detect_errata_supersession(
    chunk_id: str,
    content: str,
    rule_atom: str,
    effective_date: Optional[str],
    all_chunks_for_atom: List[dict],
) -> List[RuleEdge]:
    """
    Detecta quando um chunk é uma errata que substitui uma regra anterior.
    Cria aresta do tipo 'supersedes' do chunk mais recente para o mais antigo.
    """
    if len(all_chunks_for_atom) < 2:
        return []
    # Ordenar por data; o mais recente supersedes os anteriores
    sorted_chunks = sorted(
        all_chunks_for_atom,
        key=lambda c: c.get("effective_date") or "0000",
        reverse=True
    )
    edges = []
    newest = sorted_chunks[0]
    for older in sorted_chunks[1:]:
        if newest["id"] == chunk_id:
            edges.append(RuleEdge(
                source_chunk_id=chunk_id,
                target_rule_atom=older["rule_atom"],
                edge_type="supersedes",
                confidence=0.90,
                extracted_text=f"Errata detected: newer chunk for {rule_atom}",
            ))
    return edges

async def build_rule_graph(game_slug: str, db) -> dict:
    """
    Ponto de entrada principal. Executar após ingestão completa de um jogo.
    Retorna sumário: {edges_created, edges_skipped, cycles_prevented}
    """
    chunks = await db.fetch(
        "SELECT id, content, rule_atom FROM tcg_judge.chunks WHERE game_slug = $1 AND rule_atom IS NOT NULL",
        game_slug
    )

    edges_to_insert = []
    cycles_prevented = 0

    # Índice de arestas existentes para detecção de ciclos
    existing_edges: set[tuple] = set()

    for chunk in chunks:
        new_edges = extract_edges_from_chunk(
            chunk_id=str(chunk["id"]),
            content=chunk["content"],
            rule_atom=chunk["rule_atom"],
        )
        for edge in new_edges:
            reverse = (edge.target_rule_atom, chunk["rule_atom"])
            if reverse in existing_edges:
                logger.debug(f"Ciclo prevenido: {chunk['rule_atom']} ↔ {edge.target_rule_atom}")
                cycles_prevented += 1
                continue
            existing_edges.add((chunk["rule_atom"], edge.target_rule_atom))
            edges_to_insert.append(edge)

    # Filtrar por confidence threshold
    threshold = getattr(settings, "EDGE_CONFIDENCE_THRESHOLD", 0.70)
    valid_edges = [e for e in edges_to_insert if e.confidence >= threshold]
    skipped = len(edges_to_insert) - len(valid_edges)

    # Inserir no banco (upsert — não duplicar em re-runs)
    for edge in valid_edges:
        await db.execute(
            """
            INSERT INTO tcg_judge.rule_graph_edges
              (source_chunk_id, target_rule_atom, edge_type, confidence, extracted_text, source)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (source_chunk_id, target_rule_atom, edge_type) DO UPDATE
              SET confidence = EXCLUDED.confidence,
                  extracted_text = EXCLUDED.extracted_text
            """,
            edge.source_chunk_id, edge.target_rule_atom, edge.edge_type,
            edge.confidence, edge.extracted_text, edge.source,
        )

    return {
        "game_slug": game_slug,
        "edges_created": len(valid_edges),
        "edges_skipped_low_confidence": skipped,
        "cycles_prevented": cycles_prevented,
    }
```

### Migration: `supabase/migrations/20260520000004_rule_graph_edges_schema.sql`

```sql
ALTER TABLE tcg_judge.rule_graph_edges
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'auto_generated')),
  ADD COLUMN IF NOT EXISTS extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS effective_date DATE;

CREATE UNIQUE INDEX IF NOT EXISTS rule_graph_edges_unique_idx
  ON tcg_judge.rule_graph_edges (source_chunk_id, target_rule_atom, edge_type);

CREATE INDEX IF NOT EXISTS rule_graph_edges_confidence_idx
  ON tcg_judge.rule_graph_edges (confidence)
  WHERE confidence >= 0.70;

COMMENT ON COLUMN tcg_judge.rule_graph_edges.source IS
  'manual = criado por humano | auto_generated = criado pelo rule_graph_builder job';
```

### Nova variável em `config.py`

```python
EDGE_CONFIDENCE_THRESHOLD: float = Field(
    default=0.70,
    env="EDGE_CONFIDENCE_THRESHOLD",
    description="Arestas abaixo deste threshold são ignoradas no retrieval"
)
RULE_GRAPH_MAX_DEPTH: int = Field(
    default=3,
    env="RULE_GRAPH_MAX_DEPTH",
    description="Profundidade máxima de travessia no rule graph durante retrieval"
)
```

### Integrar detecção de ciclos no retrieval

No módulo de retrieval que usa o grafo, adicionar visited set:

```python
async def expand_chunks_via_graph(chunk_ids: list, game_slug: str, db, max_depth: int = 3) -> list:
    """Expande chunks via rule_graph_edges com proteção contra ciclos."""
    visited: set[str] = set(chunk_ids)
    queue = list(chunk_ids)
    depth = 0

    while queue and depth < max_depth:
        next_queue = []
        edges = await db.fetch(
            """
            SELECT target_rule_atom, edge_type, confidence
            FROM tcg_judge.rule_graph_edges
            WHERE source_chunk_id = ANY($1::uuid[])
              AND confidence >= $2
            ORDER BY confidence DESC
            """,
            queue, settings.EDGE_CONFIDENCE_THRESHOLD
        )
        for edge in edges:
            if edge["target_rule_atom"] not in visited:
                visited.add(edge["target_rule_atom"])
                next_queue.append(edge["target_rule_atom"])
        queue = next_queue
        depth += 1

    return list(visited)
```

### Testes

Criar `tests/judge_rule_graph/test_rule_graph_builder.py`:
- Testa `extract_edges_from_chunk` com texto MTG real contendo "See rule 702.9a"
- Verifica que auto-referência (chunk A → atom A) é ignorada
- Verifica que ciclo A→B é prevenido quando B→A já existe
- Testa que arestas com `confidence < threshold` não são inseridas
- Testa `invalidate_game_cache` é chamado após build do grafo (mock)

---

## Epic 5 — Prompts específicos por jogo

### Problema

O prompt atual é genérico. MTG (stack + priority), Yu-Gi-Oh (chains LIFO) e Pokémon (turno único) têm lógicas radicalmente diferentes que o prompt não comunica ao LLM.

### Estrutura a criar: `services/api/app/judge/prompts/`

```
judge/prompts/
├── __init__.py          # loader com fallback
├── _base.py             # sistema de tipos + helpers
├── generic.py           # prompt genérico (fallback)
├── mtg.py
├── yugioh.py
├── pokemon.py
├── lorcana.py
├── onepiece.py
└── swu.py               # preparar para Wave 2B Epic 4
```

### Criar: `judge/prompts/_base.py`

```python
from dataclasses import dataclass, field
from typing import List

@dataclass
class GamePrompt:
    system_prompt: str
    few_shot_examples: List[dict]   # [{"question": ..., "answer": ...}]
    response_format_instruction: str = (
        "Responda em português brasileiro. "
        "Comece com o veredito claro (Permitido / Não permitido / Depende). "
        "Cite as regras aplicáveis pelo número. "
        "Explique o raciocínio em no máximo 3 parágrafos."
    )
```

### Criar: `judge/prompts/__init__.py`

```python
"""
Loader de prompts específicos por jogo com fallback gracioso.

Comportamento:
- Tenta importar `judge.prompts.{game_slug}`
- Se o arquivo não existir: usa `judge.prompts.generic`
- Se generic também falhar: usa prompt hardcoded mínimo

Adicionar novo jogo: criar o arquivo .py — sem alterar este __init__.
"""

import importlib
import logging
from app.judge.prompts._base import GamePrompt

logger = logging.getLogger(__name__)

_cache: dict[str, GamePrompt] = {}

def get_game_prompt(game_slug: str) -> GamePrompt:
    if game_slug in _cache:
        return _cache[game_slug]

    for module_name in [f"app.judge.prompts.{game_slug}", "app.judge.prompts.generic"]:
        try:
            module = importlib.import_module(module_name)
            prompt = module.PROMPT
            _cache[game_slug] = prompt
            if "generic" in module_name:
                logger.warning(f"Nenhum prompt específico para '{game_slug}', usando generic.")
            return prompt
        except (ImportError, AttributeError):
            continue

    logger.error(f"Falha ao carregar qualquer prompt para '{game_slug}'. Usando mínimo.")
    return _FALLBACK_PROMPT

_FALLBACK_PROMPT = GamePrompt(
    system_prompt=(
        "You are a TCG rules expert. Answer questions about trading card game rules "
        "accurately, citing specific rule numbers when available."
    ),
    few_shot_examples=[],
)
```

### Criar: `judge/prompts/mtg.py`

```python
from app.judge.prompts._base import GamePrompt

PROMPT = GamePrompt(
    system_prompt="""Você é um juiz oficial de Magic: The Gathering com conhecimento completo
das Comprehensive Rules (CR). Ao responder perguntas de regras:

STACK E PRIORIDADE:
- Ações instantâneas e habilidades usam a stack. Efeitos resolvem do topo para baixo.
- Após cada ação, o jogador ativo recebe prioridade primeiro.
- Triggered abilities entram na stack quando sua condição de trigger é satisfeita e
  o próximo jogador com prioridade a recebe.

REPLACEMENT EFFECTS:
- Não usam a stack. São aplicados quando o evento que substituem ocorreria.
- Se múltiplos replacement effects se aplicam ao mesmo evento, o controlador do
  objeto afetado escolhe a ordem de aplicação (exceto quando um efeito diz "instead").

LAYERS:
- Efeitos contínuos são aplicados em camadas (1-7). A camada 7 tem sub-camadas (a-e).
- Nunca aplique efeitos de layer 7b antes de layer 7a, independente de quando foram criados.

Cite sempre o número da regra CR (ex: CR 702.9a, CR 116.3c).
Responda em português brasileiro.""",

    few_shot_examples=[
        {
            "question": "Uma criatura com Trample ataca uma criatura com 2 de resistência. O defensor tem 5 de toughness. O atacante tem 7 de power. Quanto dano vai para o jogador?",
            "answer": "Permitido — o excesso vai para o jogador defensor. Trample (CR 702.19) permite atribuir dano letal ao bloqueador (o mínimo necessário para destruí-lo) e o restante ao jogador ou planeswalker sendo atacado. Neste caso: 2 de dano letal ao bloqueador + 5 de dano ao jogador defensor."
        },
        {
            "question": "Posso ativar uma habilidade de tap de uma criatura que acabei de jogar?",
            "answer": "Depende — criaturas com summoning sickness (CR 302.6) não podem ativar habilidades com o símbolo de tap (⊤) no custo na mesma rodada em que entram em jogo, a menos que tenham Velocidade (Haste). Habilidades de tap que não usam ⊤ no custo podem ser ativadas normalmente."
        },
    ],
)
```

### Criar: `judge/prompts/yugioh.py`

```python
from app.judge.prompts._base import GamePrompt

PROMPT = GamePrompt(
    system_prompt="""Você é um juiz oficial de Yu-Gi-Oh! com conhecimento do OCG e TCG.

CHAINS E SPELL SPEED:
- Spell Speed 1: monstros de efeito ativados em Main Phase, maioria dos efeitos contínuos.
- Spell Speed 2: cartas mágicas, armadilhas, efeitos de Quick Effects.
- Spell Speed 3: Counter Traps (somente outras Counter Traps podem ser encadeadas).
- Uma chain só pode ser formada com efeitos de Spell Speed >= ao efeito anterior na chain.

RESOLUÇÃO DE CHAIN:
- Chains resolvem na ordem LIFO (Last In, First Out): o último efeito adicionado resolve primeiro.
- Ao resolver, cada efeito na chain é resolvido sequencialmente do topo para baixo.

TIMING DE INVOCAÇÃO:
- "When [card] is Normal Summoned": efeito de trigger obrigatório — vai para a chain.
- "If [card] is Normal Summoned": efeito de trigger opcional — o controlador decide.
- Efeitos opcionais de "When" devem ser adicionados à chain imediatamente (missed timing).

Cite a seção do rulebook quando aplicável. Responda em português brasileiro.""",

    few_shot_examples=[
        {
            "question": "Meu oponente ativa Torrential Tribute quando eu invoco um monstro. Posso encadear com Starlight Road?",
            "answer": "Sim. Torrential Tribute é Spell Speed 2 (Armadilha Normal). Starlight Road também é Spell Speed 2, portanto pode ser encadeado. Ao resolver: Starlight Road resolve primeiro (negando e destruindo Torrential Tribute), depois Torrential Tribute tenta resolver, mas foi negada."
        },
    ],
)
```

### Criar: `judge/prompts/pokemon.py`

```python
from app.judge.prompts._base import GamePrompt

PROMPT = GamePrompt(
    system_prompt="""Você é um árbitro oficial do Pokémon TCG.

CONDIÇÕES DE STATUS:
- Burn: 20 de dano entre turnos. Curar com flip ou retirar do campo.
- Poison: 10 de dano entre turnos (Badly Poisoned: 10×turno acumulado).
- Sleep, Paralysis, Confusion: resolvem com flip no início do turno do controlador.
- Um Pokémon só pode ter uma condição especial por vez (exceto Burn + Poison simultaneamente).

DANO NO BENCH:
- Dano no banco NÃO aplica Weakness ou Resistance.
- Dano no banco NÃO é afetado por efeitos de "prevent all damage" (a menos que o efeito especifique).

RESTRIÇÕES DE EVOLUÇÃO:
- Um Pokémon que acabou de entrar em jogo neste turno NÃO pode evoluir (exceto com carta específica).
- A regra de "1 evolução por turno por Pokémon" aplica-se separadamente para cada Pokémon.

ATAQUES:
- Cada Pokémon só pode atacar uma vez por turno, no final da Main Phase.
- Habilidades (Abilities) não são ataques — podem ser usadas antes de atacar.

Responda em português brasileiro.""",

    few_shot_examples=[
        {
            "question": "Meu Pokémon ativo está Poisoned. Posso também aplicar Burn com um ataque?",
            "answer": "Sim. Burn e Poison são a única combinação de condições especiais que podem existir simultaneamente (Pokémon TCG Rulebook, seção de Status Conditions). Todos os outros pares de condições especiais se substituem — a nova condição remove a anterior."
        },
    ],
)
```

### Integrar no `rag_orchestrator.py`

No ponto onde o system prompt é montado:
```python
from app.judge.prompts import get_game_prompt

game_prompt = get_game_prompt(game_slug)
system_message = f"{game_prompt.system_prompt}\n\n{game_prompt.response_format_instruction}"

# Few-shots como mensagens iniciais da conversa
messages = []
for example in game_prompt.few_shot_examples:
    messages.append({"role": "user", "content": example["question"]})
    messages.append({"role": "assistant", "content": example["answer"]})
messages.append({"role": "user", "content": question_with_context})
```

### Testes

Criar `tests/judge_game_prompts/test_game_prompts.py`:
- Testa que `get_game_prompt("mtg")` retorna `GamePrompt` com `system_prompt` não-vazio
- Testa que `get_game_prompt("jogo_inexistente")` retorna generic sem lançar exceção
- Testa que cada arquivo `.py` em `judge/prompts/` exporta `PROMPT: GamePrompt`
- Testa que `few_shot_examples` tem a estrutura correta (keys `question` e `answer`)

---

## Epic 6 — Dashboard de qualidade do Judge

### Arquivos a ler

- `frontend/runtime_console_v3/src/app/observability/` — estrutura da página atual
- `services/api/app/api/v1/runtime_judge.py` — adicionar endpoint de métricas aqui

### Backend: endpoint de métricas

Criar `GET /runtime/judge/quality-metrics` que retorna:

```json
{
  "generated_at": "2026-05-20T14:30:00Z",
  "games": {
    "mtg": {
      "queries_24h": 347,
      "thumbs_up_pct": 0.82,
      "thumbs_down_pct": 0.18,
      "confidence_avg": 0.71,
      "cache_hit_rate": 0.34,
      "alert_active": false,
      "latency_p50_ms": 1840,
      "latency_p95_ms": 4200,
      "latency_p99_ms": 7100,
      "latency_by_phase": {
        "embedding_ms": 120,
        "hyde_ms": 380,
        "retrieval_ms": 290,
        "reranking_ms": 510,
        "generation_ms": 1540
      }
    }
  },
  "alerts": []
}
```

Usar dados das tabelas `retrieval_feedback` e fases SSE persistidas.

### Frontend: nova aba no `/observability`

Adicionar aba "Judge Quality" à página de observabilidade existente.

**Componentes a criar em `components/observability/judge/`:**

- `GameQualityCard.tsx` — card por jogo com métricas resumidas + badge de alerta
- `JudgeLatencyChart.tsx` — histograma de latência por fase (usar Recharts, já instalado)
- `JudgeTrendsTable.tsx` — tabela com últimos 7 / 30 / 90 dias (seletor de período)
- `JudgeAlertBanner.tsx` — banner vermelho quando `alert_active=true` para algum jogo

**Lógica de alerta automático:**

No backend, ao calcular métricas:
```python
# Se thumbs_down_pct > 0.20 por 48h consecutivas para algum jogo:
# Inserir em tabela judge_alerts (criar se não existir)
# Notificar via ALERT_WEBHOOK_URL se configurado
```

**Variável de ambiente:**
```python
ALERT_WEBHOOK_URL: Optional[str] = Field(
    default=None,
    env="ALERT_WEBHOOK_URL",
    description="Webhook Slack/Discord. Se None, alerta apenas na UI."
)
```

### Testes

Criar `tests/judge_observability/test_quality_metrics.py`:
- Testa endpoint com dados sintéticos na tabela `retrieval_feedback`
- Verifica que `alert_active=true` quando `thumbs_down_pct > 0.20` em 48h
- Verifica que `cache_hit_rate` bate com mocks do Redis

---

## Epic 7 — Decomposição de perguntas complexas (P1 — ausente das waves)

### Por que incluir aqui

Perguntas sobre múltiplas mecânicas ("como Trample interage com Deathtouch e First Strike?") são o caso de uso mais frequente de consulta no MTG e Yu-Gi-Oh. O pipeline atual faz retrieval de uma query única, podendo recuperar chunks de apenas uma das mecânicas.

### Criar: `services/api/app/retrieval/query_decomposer.py`

```python
"""
Decomposição de perguntas complexas para retrieval paralelo.

Detecta quando uma pergunta menciona múltiplas mecânicas ou palavras-chave
de regras e decompõe em sub-queries independentes.

Exemplo:
  Input: "Como Trample interage com Deathtouch?"
  Sub-queries: ["Como funciona Trample?", "Como funciona Deathtouch?", "Trample Deathtouch interação"]

Retrieval paralelo por sub-query + fusão RRF dos chunks resultantes.
O LLM recebe o conjunto agregado de chunks e a pergunta original.
"""

import re
import asyncio
import logging
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Palavras-chave de mecânicas por jogo — expandir conforme corpus cresce
MECHANIC_KEYWORDS: dict[str, List[str]] = {
    "mtg": [
        "trample", "deathtouch", "first strike", "double strike", "flying",
        "reach", "vigilance", "lifelink", "hexproof", "shroud", "protection",
        "regenerate", "indestructible", "flash", "haste", "menace",
    ],
    "yugioh": [
        "chain", "spell speed", "quick effect", "trigger effect", "continuous effect",
        "negate", "destroy", "banish", "graveyard", "special summon",
    ],
    "pokemon": [
        "burn", "poison", "paralysis", "sleep", "confusion",
        "bench", "evolve", "ability", "attack", "weakness", "resistance",
    ],
}

def detect_mechanics(question: str, game_slug: str) -> List[str]:
    """Retorna lista de mecânicas detectadas na pergunta."""
    keywords = MECHANIC_KEYWORDS.get(game_slug, [])
    question_lower = question.lower()
    return [kw for kw in keywords if kw in question_lower]

def should_decompose(question: str, game_slug: str) -> bool:
    """True se a pergunta menciona 2+ mecânicas distintas."""
    mechanics = detect_mechanics(question, game_slug)
    return len(mechanics) >= 2

def build_sub_queries(question: str, mechanics: List[str], game_slug: str) -> List[str]:
    """Gera sub-queries: uma por mecânica + a pergunta de interação."""
    game_names = {"mtg": "Magic: The Gathering", "yugioh": "Yu-Gi-Oh!", "pokemon": "Pokémon TCG"}
    game = game_names.get(game_slug, "TCG")
    sub_queries = [f"Como funciona {mech} em {game}?" for mech in mechanics]
    sub_queries.append(question)  # pergunta original como sub-query de interação
    return sub_queries

async def decompose_and_retrieve(
    question: str,
    game_slug: str,
    retrieve_fn,      # função async: (query, game_slug) → List[chunk]
    top_k: int = 5,
) -> List[dict]:
    """
    Retrieval paralelo por sub-query com fusão RRF.
    Retorna lista de chunks deduplicados e ordenados por relevância agregada.
    """
    if not should_decompose(question, game_slug):
        return await retrieve_fn(question, game_slug)

    mechanics = detect_mechanics(question, game_slug)
    sub_queries = build_sub_queries(question, mechanics, game_slug)
    logger.debug(f"Decomposição: {len(sub_queries)} sub-queries para '{question[:50]}...'")

    # Retrieval paralelo
    results = await asyncio.gather(*[
        retrieve_fn(q, game_slug) for q in sub_queries
    ], return_exceptions=True)

    # Filtrar exceções, manter resultados válidos
    valid_results = [r for r in results if isinstance(r, list)]

    if not valid_results:
        logger.warning("Todas as sub-queries falharam, usando query original")
        return await retrieve_fn(question, game_slug)

    # Fusão RRF de todas as listas de chunks
    from app.retrieval.fusion import weighted_rrf_merge_two_lists  # usar fusão existente
    merged = valid_results[0]
    for result_list in valid_results[1:]:
        merged = weighted_rrf_merge_two_lists(merged, result_list, weight_b=0.5)

    return merged[:top_k]
```

### Integrar no `rag_orchestrator.py`

Substituir a chamada de retrieval por:
```python
from app.retrieval.query_decomposer import decompose_and_retrieve

retrieved_chunks = await decompose_and_retrieve(
    question=question,
    game_slug=game_slug,
    retrieve_fn=self._vector_search,
    top_k=self.config.RETRIEVAL_TOP_K,
)
```

### Nova variável em `config.py`

```python
QUERY_DECOMPOSITION_ENABLED: bool = Field(default=True, env="QUERY_DECOMPOSITION_ENABLED")
```

### Testes

Criar `tests/retrieval/test_query_decomposer.py`:
- `detect_mechanics("Como Trample interage com Deathtouch?", "mtg")` → `["trample", "deathtouch"]`
- `should_decompose("O que é Flying?", "mtg")` → `False` (mecânica única)
- `should_decompose("Flying vs Reach", "mtg")` → `True`
- Testa que retrieval paralelo falha graciosamente (uma sub-query falha → usa as outras)
- Testa que chunks de sub-queries diferentes são mesclados sem duplicatas

---

## Epic 8 — Injeção automática de errata

### Por que incluir aqui

Chunks da regra base recuperados sem a errata mais recente geram vereditos desatualizados. O `rule_graph_edges` do Epic 4 já tem o tipo `supersedes` — falta só injetar automaticamente no retrieval.

### Modificar: retrieval pós-processamento em `rag_orchestrator.py`

Após o retrieval (e após o reranker), antes de montar o contexto para o LLM:

```python
async def inject_errata(chunks: List[dict], db) -> List[dict]:
    """
    Para cada chunk recuperado, verifica se existe uma errata mais recente.
    Se sim, substitui o chunk pela errata e adiciona flag para exibir no frontend.
    """
    enriched = []
    for chunk in chunks:
        chunk_id = chunk.get("id")
        if not chunk_id:
            enriched.append(chunk)
            continue

        errata = await db.fetchrow(
            """
            SELECT c.*
            FROM tcg_judge.rule_graph_edges e
            JOIN tcg_judge.chunks c ON c.rule_atom = e.target_rule_atom
            WHERE e.source_chunk_id = $1
              AND e.edge_type = 'supersedes'
              AND c.game_slug = $2
            ORDER BY c.created_at DESC
            LIMIT 1
            """,
            chunk_id, chunk.get("game_slug")
        )

        if errata:
            errata_dict = dict(errata)
            errata_dict["errata_supersedes"] = chunk.get("rule_atom")
            errata_dict["source_type"] = "errata"
            enriched.append(errata_dict)
            logger.debug(f"Errata injetada: {chunk.get('rule_atom')} → {errata_dict.get('rule_atom')}")
        else:
            enriched.append(chunk)

    return enriched
```

O frontend já exibe `source_type = "errata"` com badge âmbar após o Epic 2 desta wave.

---

## Documentação a criar

```
docs/JUDGE_EVALUATION_PIPELINE.md   — CI, gates, baseline.json
docs/JUDGE_SEMANTIC_CACHE.md        — dois providers, invalidação, métricas
docs/JUDGE_RULE_GRAPH.md            — auto-geração, tipos de aresta, ciclos
docs/JUDGE_GAME_PROMPTS.md          — como adicionar novo jogo
docs/JUDGE_QUALITY_DASHBOARD.md     — métricas, alertas, webhook
docs/JUDGE_QUERY_DECOMPOSITION.md   — detecção de mecânicas, sub-queries
docs/JUDGE_ERRATA_INJECTION.md      — fluxo de detecção e substituição
```

---

## Critérios de aceitação da Wave 2A

- CI bloqueia merge em regressão > 5% de accuracy@1 (exceto jogos em re-ingestão)
- Cache hit retorna resposta sem chamar OpenAI ou retrieval vetorial
- Cache invalidado automaticamente após ingestão
- Cache key inclui model slug — upgrade de modelo invalida automaticamente
- `get_game_prompt("jogo_inexistente")` retorna generic sem erro
- Rule graph edges não contêm ciclos A→B onde B→A já existe
- Errata substituem automaticamente chunks desatualizados no contexto do LLM
- Perguntas com 2+ mecânicas detectadas fazem retrieval paralelo
- Dashboard exibe thumbs-up%, confidence_avg e latência por fase
- ALERT_WEBHOOK_URL recebe notificação quando thumbs-down > 20% em 48h
- Todos os novos componentes têm fallback gracioso com Redis/DB indisponíveis
- `ruff check .` sem erros
- `pytest tests/judge_quality tests/retrieval tests/judge_rule_graph tests/judge_game_prompts tests/judge_observability -q` — todos verdes
- Zero regressões na Wave 1 (pytest tests/ -q deve continuar passando)
