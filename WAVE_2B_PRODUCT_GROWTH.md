# Cursor Prompt — Wave 2B: Product Growth & User Retention

## Contexto do projeto

**Judge TCG** (`judgetcg.com.br`) — assistente de regras para Trading Card Games.

Waves anteriores implementadas (não tocar):
- Wave 1 Epics 1–6: HNSW, Reranker, HyDE, Chunking hierárquico, Feedback 👍/👎, SSE fases
- Wave 2A: CI avaliação, Source cards, Cache semântico, Rule graph, Prompts por jogo, Dashboard qualidade, Decomposição queries, Injeção errata

Stack: FastAPI (Python) + Next.js 14 (TypeScript) + Supabase (PostgreSQL) + Redis (Upstash) + OpenAI

Estrutura relevante:
```
tcg-judge/
├── services/api/app/
│   ├── api/v1/runtime_judge.py
│   ├── core/config.py
│   └── judge/registry.py
├── supabase/migrations/
├── frontend/runtime_console_v3/src/
│   ├── app/judge/JudgePageClient.tsx
│   ├── components/judge/
│   │   ├── FeedbackButtons.tsx      (Wave 1)
│   │   ├── StreamingIndicator.tsx   (Wave 1)
│   │   └── SourceCard.tsx           (Wave 2A)
│   ├── features/                    (pode não existir — criar)
│   └── services/judgeApi.ts
└── tests/
```

Lê **todos** os arquivos mencionados antes de qualquer implementação.

---

## Restrições globais

- NÃO quebrar funcionalidades existentes.
- Manter degradação graciosa: todas as features funcionam mesmo com Redis, Supabase ou Auth indisponíveis.
- Auth é opcional: sem login, toda a experiência continua funcionando via localStorage.
- Redis é opcional: cache, analytics e rate limit usam fallback em memória.
- Preservar retrocompatibilidade total com payloads de todas as waves anteriores.
- stdlib-first.
- Todos os novos componentes precisam de testes, docstring e observabilidade.

---

## Epic 1 — Auth Judge + histórico cloud

### Objetivo

Persistir histórico de conversas no Supabase para utilizadores autenticados, mantendo localStorage como fallback para sessões anônimas.

### Schema de banco

Cria `supabase/migrations/20260521000001_judge_auth_history.sql`:

```sql
-- Tabela de favoritos (separada de conversations — favoritos persistem)
CREATE TABLE IF NOT EXISTS tcg_judge.saved_answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_slug     TEXT NOT NULL,
  question      TEXT NOT NULL,
  verdict       TEXT,
  sources       JSONB DEFAULT '[]',
  full_response JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX saved_answers_user_idx ON tcg_judge.saved_answers (user_id, created_at DESC);

-- Row Level Security: usuário só acessa seus próprios dados
ALTER TABLE tcg_judge.saved_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_answers_owner" ON tcg_judge.saved_answers
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tabela de sessões públicas (compartilháveis via deep link)
-- Separada de conversations para não expor histórico privado
CREATE TABLE IF NOT EXISTS tcg_judge.shared_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  game_slug     TEXT NOT NULL,
  question      TEXT NOT NULL,
  response_json JSONB NOT NULL,
  share_token   TEXT UNIQUE NOT NULL,  -- HMAC-assinado, gerado pela API
  expires_at    TIMESTAMPTZ,           -- NULL = não expira
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX shared_sessions_token_idx ON tcg_judge.shared_sessions (share_token);

-- Sem RLS em shared_sessions — são públicas por design
-- A validação é feita via assinatura HMAC no token
```

### Criar: `frontend/src/features/auth/`

Estrutura:
```
features/auth/
├── AuthProvider.tsx       # Context + Supabase session listener
├── LoginButton.tsx        # Botão Google OAuth
├── UserMenu.tsx           # Avatar + dropdown (histórico, favoritos, logout)
├── useAuth.ts             # Hook: { user, session, signIn, signOut }
└── historyMigration.ts    # Migração localStorage → cloud no primeiro login
```

#### `features/auth/AuthProvider.tsx`

```tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User, Session } from "@supabase/supabase-js";
import { migrateLocalStorageHistory } from "./historyMigration";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMigrated, setHasMigrated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Migração localStorage → cloud apenas no primeiro login da sessão
        if (event === "SIGNED_IN" && session && !hasMigrated) {
          setHasMigrated(true);
          await migrateLocalStorageHistory(session.access_token).catch(
            err => console.warn("Migração de histórico falhou (não crítico):", err)
          );
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/judge` },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
```

#### `features/auth/historyMigration.ts` — CRÍTICO

Esta função resolve o bloqueante de migração localStorage → cloud no primeiro login:

```typescript
/**
 * Migração de histórico localStorage → Supabase no primeiro login.
 *
 * Fluxo:
 * 1. Lê entradas do localStorage (judge:history)
 * 2. POST /api/judge/history/migrate com array de entries
 * 3. Em sucesso: limpa localStorage (evitar duplicatas em próximos logins)
 * 4. Em falha: mantém localStorage intacto (retry automático no próximo login)
 *
 * Esta função é idempotente: se o servidor já tiver as entradas (ON CONFLICT DO NOTHING),
 * a migração não duplica dados.
 */
export async function migrateLocalStorageHistory(accessToken: string): Promise<void> {
  const raw = localStorage.getItem("judge:history");
  if (!raw) return; // nada a migrar

  let entries: unknown[];
  try {
    entries = JSON.parse(raw);
  } catch {
    localStorage.removeItem("judge:history"); // corrompido — descartar
    return;
  }

  if (!Array.isArray(entries) || entries.length === 0) return;

  const response = await fetch("/api/judge/history/migrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ entries }),
  });

  if (response.ok) {
    localStorage.removeItem("judge:history");
    console.info(`[Auth] ${entries.length} entradas migradas para a nuvem.`);
  } else {
    console.warn(`[Auth] Migração falhou (${response.status}) — mantendo localStorage para retry.`);
  }
}
```

### Criar: `services/api/app/api/v1/judge_history.py`

```python
"""
Endpoints de histórico cloud do Judge TCG.
Autenticados via Supabase JWT (Bearer token no Authorization header).
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/judge")

class HistoryEntry(BaseModel):
    game_slug: str
    question: str
    verdict: Optional[str] = None
    sources: List[dict] = []
    created_at: Optional[str] = None  # ISO timestamp do localStorage

class MigrateHistoryRequest(BaseModel):
    entries: List[HistoryEntry]

@router.post("/history/migrate", status_code=202)
async def migrate_history(
    payload: MigrateHistoryRequest,
    user_id: str = Depends(get_current_user_id),  # extraído do JWT Supabase
    db = Depends(get_db),
):
    """
    Migra entradas do localStorage para o Supabase conversations/messages.
    ON CONFLICT DO NOTHING garante idempotência.
    Aceita até 50 entradas por chamada.
    """
    if len(payload.entries) > 50:
        raise HTTPException(status_code=400, detail="Máximo de 50 entradas por migração.")

    for entry in payload.entries:
        await db.execute(
            """
            INSERT INTO tcg_judge.conversations
              (user_id, game_slug, created_at)
            VALUES ($1, $2, COALESCE($3::TIMESTAMPTZ, NOW()))
            ON CONFLICT DO NOTHING
            """,
            user_id, entry.game_slug, entry.created_at,
        )
    return {"migrated": len(payload.entries)}
```

### Modificar: `services/judgeApi.ts`

Modificar `judge-history.ts` (ou equivalente) para usar cloud quando autenticado:

```typescript
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const HISTORY_KEY = "judge:history";
const MAX_LOCAL_ENTRIES = 10;

export async function saveJudgeEntry(entry: HistoryEntry): Promise<void> {
  const supabase = createClientComponentClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Usuário autenticado → cloud
    await fetch("/api/judge/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(entry),
    });
  } else {
    // Anônimo → localStorage com limite
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    history.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_LOCAL_ENTRIES)));
  }
}
```

### Deep links: `?session=UUID`

Ao abrir `/judge?session=UUID`:
1. `GET /api/judge/session/{uuid}` → retorna a resposta completa
2. Pré-popular o `ResponseCard` com os dados da sessão
3. Mostrar banner: "Você está vendo uma conversa compartilhada"

### Rate limit diferenciado por autenticação

**Este bloqueante estava ausente de todas as waves anteriores.**

Modificar o rate limiter existente em `services/api/app/`:

```python
# No middleware de rate limiting, distinguir autenticado vs anônimo:
def get_rate_limit_key(request: Request) -> tuple[str, int]:
    """
    Retorna (chave_redis, limite_por_minuto).
    Autenticados têm limite 3× maior que anônimos.
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        # Extrair user_id do JWT sem validação completa (já validado pelo Supabase)
        import base64, json
        try:
            payload = json.loads(base64.b64decode(token.split(".")[1] + "=="))
            user_id = payload.get("sub", "")
            return f"rl:judge:auth:{user_id}", 60  # 60 req/min autenticado
        except Exception:
            pass
    # Anônimo: rate limit por IP
    client_ip = request.client.host
    return f"rl:judge:anon:{client_ip}", 20  # 20 req/min anônimo
```

Variáveis de ambiente:
```python
RATE_LIMIT_ANON_PER_MIN: int = Field(default=20, env="RATE_LIMIT_ANON_PER_MIN")
RATE_LIMIT_AUTH_PER_MIN: int = Field(default=60, env="RATE_LIMIT_AUTH_PER_MIN")
```

### Testes

Criar `tests/auth/test_auth_flow.py`:
- Testa `migrateLocalStorageHistory` com mock fetch: sucesso → localStorage limpo
- Testa `migrateLocalStorageHistory` com mock fetch 500: localStorage preservado
- Testa `/api/judge/history/migrate` com JWT válido
- Testa limite de 50 entradas por migração
- Testa rate limit: anônimo recebe 429 após 20 req/min, autenticado só após 60

---

## Epic 2 — Open Graph dinâmico para vereditos

### Arquivos a ler

- `frontend/runtime_console_v3/src/components/judge/ShareVerdictButton.tsx` — botão existente
- `frontend/runtime_console_v3/src/services/judgeApi.ts`

### Criar: `frontend/src/app/api/og/verdict/route.ts`

```typescript
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shareToken = searchParams.get("token");

  if (!shareToken) {
    return new Response("Missing token", { status: 400 });
  }

  // Buscar dados da sessão compartilhada via token
  const sessionData = await fetchSharedSession(shareToken);
  if (!sessionData) {
    return new Response("Session not found", { status: 404 });
  }

  const { game_slug, question, verdict, confidence } = sessionData;
  const gameInfo = TCG_BRAND[game_slug] ?? TCG_BRAND.generic;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: gameInfo.bgColor,
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px" }}>{gameInfo.emoji}</div>
          <div style={{ fontSize: "28px", fontWeight: "500", color: gameInfo.textColor }}>
            Judge TCG — {gameInfo.name}
          </div>
        </div>

        <div style={{ fontSize: "32px", color: gameInfo.textColor, marginBottom: "32px", lineHeight: "1.4" }}>
          {question.length > 120 ? question.slice(0, 117) + "..." : question}
        </div>

        <div
          style={{
            padding: "20px 32px",
            backgroundColor: verdict?.includes("Permitido") ? "#EAF3DE" : "#FCEBEB",
            borderRadius: "12px",
            fontSize: "36px",
            fontWeight: "500",
            color: verdict?.includes("Permitido") ? "#3B6D11" : "#A32D2D",
          }}
        >
          {verdict ?? "Veredito pendente"}
        </div>

        <div style={{ marginTop: "auto", fontSize: "18px", color: gameInfo.subtextColor }}>
          judgetcg.com.br · Consulta de regras por IA
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

### Compartilhamento seguro com rotação de secrets

**Problema resolvido:** sem estratégia de rotação, todos os links quebram ao rotacionar o secret.

**Solução com grace period de 30 dias:**

```python
# services/api/app/core/config.py
SHARE_SIGNING_SECRET_CURRENT: str = Field(..., env="SHARE_SIGNING_SECRET_CURRENT")
SHARE_SIGNING_SECRET_PREVIOUS: Optional[str] = Field(
    default=None,
    env="SHARE_SIGNING_SECRET_PREVIOUS",
    description="Secret anterior. Links assinados com ele são aceitos por 30 dias após rotação."
)

# services/api/app/utils/share_tokens.py
import hmac, hashlib, time

def create_share_token(session_id: str, secret: str) -> str:
    """Gera token HMAC-SHA256: {session_id}.{timestamp}.{signature}"""
    timestamp = str(int(time.time()))
    message = f"{session_id}.{timestamp}"
    sig = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()[:16]
    return f"{session_id}.{timestamp}.{sig}"

def validate_share_token(token: str, current_secret: str, previous_secret: Optional[str] = None) -> Optional[str]:
    """
    Valida token. Tenta current_secret primeiro; se falhar, tenta previous_secret.
    Retorna session_id se válido, None se inválido ou expirado.
    """
    try:
        session_id, timestamp, sig = token.rsplit(".", 2)
    except ValueError:
        return None

    for secret in filter(None, [current_secret, previous_secret]):
        message = f"{session_id}.{timestamp}"
        expected = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()[:16]
        if hmac.compare_digest(sig, expected):
            return session_id

    return None
```

**Rotação de secret sem quebrar links:**
1. Mover valor de `SHARE_SIGNING_SECRET_CURRENT` para `SHARE_SIGNING_SECRET_PREVIOUS`
2. Gerar novo `SHARE_SIGNING_SECRET_CURRENT`
3. Após 30 dias: remover `SHARE_SIGNING_SECRET_PREVIOUS`

### Modificar: `ShareVerdictButton.tsx`

```tsx
// Ao clicar em Compartilhar:
// 1. POST /api/judge/share com { game_slug, question, response_json }
// 2. Receber { share_token, share_url }
// 3. Copiar share_url para clipboard
// 4. share_url = `https://judgetcg.com.br/judge?share={share_token}`
// 5. OG image: `https://judgetcg.com.br/api/og/verdict?token={share_token}`
```

### Testes

Criar `tests/auth/test_share_tokens.py`:
- `create_share_token` + `validate_share_token` com mesmo secret → válido
- Token adulterado (1 char diferente) → `None`
- Token com `previous_secret` → válido (grace period)
- Token com secret desconhecido → `None`

---

## Epic 3 — Perguntas relacionadas pós-veredito

### Decisão de design — resolvendo a ambiguidade "LLM ou heurística"

**Estratégia em dois estágios:**

**Estágio 1 — Heurística (zero custo, sem LLM):**
- Extrai `rule_atoms` das fontes retornadas
- Busca chunks vizinhos no rule graph (arestas `references` e `example_of`)
- Gera perguntas template: `"Como funciona {rule_title} em {game_name}?"`
- Usar quando ≥ 2 rule_atoms distintos encontrados nas fontes

**Estágio 2 — LLM (gpt-4o-mini, ~$0.0001/query, 150 tokens):**
- Ativar quando heurística retorna < 2 sugestões
- Prompt: dado a pergunta original e os rule_atoms recuperados, gerar 2–3 perguntas relacionadas
- Resultado cacheado no Redis junto com a resposta principal (zero custo extra de TTL)

### Backend: `services/api/app/judge/related_questions.py`

```python
"""
Geração de perguntas relacionadas pós-veredito.

Dois estágios:
1. Heurística via rule_graph: zero custo, instantâneo.
2. LLM (gpt-4o-mini) como fallback quando heurística insuficiente.

Resultado sempre cacheado no Redis junto com a resposta principal.
Métricas de CTR coletadas via endpoint /runtime/judge/feedback com type="related_click".
"""

from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

async def generate_related_questions(
    question: str,
    game_slug: str,
    game_name: str,
    source_rule_atoms: List[str],
    db,
    openai_client,
    max_suggestions: int = 3,
) -> List[str]:
    """Retorna lista de sugestões. Nunca lança exceção — retorna [] em falha."""
    try:
        suggestions = await _heuristic_suggestions(
            rule_atoms=source_rule_atoms,
            game_slug=game_slug,
            game_name=game_name,
            db=db,
        )

        if len(suggestions) < 2:
            suggestions = await _llm_suggestions(
                question=question,
                game_name=game_name,
                rule_atoms=source_rule_atoms,
                openai_client=openai_client,
                max_suggestions=max_suggestions,
            )

        return suggestions[:max_suggestions]
    except Exception as exc:
        logger.warning(f"Geração de perguntas relacionadas falhou: {exc}")
        return []

async def _heuristic_suggestions(
    rule_atoms: List[str],
    game_slug: str,
    game_name: str,
    db,
) -> List[str]:
    """Busca chunks vizinhos no rule graph e gera perguntas template."""
    if not rule_atoms:
        return []

    neighbors = await db.fetch(
        """
        SELECT DISTINCT c.rule_title, c.rule_atom
        FROM tcg_judge.rule_graph_edges e
        JOIN tcg_judge.chunks c ON c.rule_atom = e.target_rule_atom
        WHERE e.source_chunk_id IN (
          SELECT id FROM tcg_judge.chunks
          WHERE rule_atom = ANY($1) AND game_slug = $2
        )
          AND e.edge_type IN ('references', 'example_of')
          AND e.confidence >= 0.7
          AND c.rule_title IS NOT NULL
          AND c.rule_atom != ALL($1)
        LIMIT 5
        """,
        rule_atoms, game_slug
    )

    return [
        f"Como funciona {row['rule_title']} em {game_name}?"
        for row in neighbors
        if row["rule_title"]
    ]

async def _llm_suggestions(
    question: str,
    game_name: str,
    rule_atoms: List[str],
    openai_client,
    max_suggestions: int,
) -> List[str]:
    """LLM fallback. Gera sugestões a partir da pergunta e rule_atoms."""
    atoms_str = ", ".join(rule_atoms) if rule_atoms else "N/A"
    prompt = (
        f"A pergunta foi: '{question}'\n"
        f"Regras citadas na resposta: {atoms_str}\n\n"
        f"Gere exatamente {max_suggestions} perguntas relacionadas sobre {game_name} "
        f"que um jogador poderia querer saber em seguida. "
        f"Uma pergunta por linha. Sem numeração. Em português brasileiro."
    )

    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.4,
    )

    raw = response.choices[0].message.content.strip()
    return [line.strip() for line in raw.split("\n") if line.strip()][:max_suggestions]
```

### Frontend: `components/judge/RelatedQuestions.tsx`

```tsx
"use client";

interface RelatedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;  // pré-popula input, NÃO envia
}

export function RelatedQuestions({ questions, onSelect }: RelatedQuestionsProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div style={{ marginTop: "16px" }}>
      <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginBottom: "8px" }}>
        Perguntas relacionadas
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => {
              onSelect(q);
              // Registrar CTR para analytics
              fetch("/api/proxy/runtime/judge/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "related_click",
                  suggestion: q,
                  game_slug: undefined,  // preenchido pelo contexto pai
                }),
              }).catch(() => {});  // best-effort
            }}
            style={{
              fontSize: "13px",
              padding: "6px 12px",
              borderRadius: "var(--border-radius-md)",
              border: "0.5px solid var(--color-border-secondary)",
              background: "var(--color-background-secondary)",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Testes

Criar `tests/judge_related_questions/test_related_questions.py`:
- Testa `_heuristic_suggestions` com mock de DB retornando neighbors conhecidos
- Testa que `_llm_suggestions` é chamado apenas quando heurística retorna < 2 itens
- Testa que exceção no LLM retorna `[]` sem propagar
- Testa CTR event: clicar em sugestão dispara `POST /feedback` com `type=related_click`

---

## Epic 4 — Star Wars Unlimited

### Verificação prévia obrigatória

**Antes de implementar o crawler**, verificar manualmente a URL:
1. Acessar `https://www.starwarsunlimited.com/rules` e confirmar se existe e o formato
2. Alternativa conhecida: PDFs oficiais em `https://www.atomicmassgames.com/swu-documents`
3. Se URL inválida: usar fallback de upload manual via UI de ingestão (Wave 2C Epic 5)

O crawler deve ter a URL configurável via `SWU_RULES_URL` em `config.py` — não hardcoded.

### Modificar: `services/api/app/judge/registry.py`

Adicionar entrada `swu`:

```python
"swu": {
    "slug": "swu",
    "display_name": "Star Wars Unlimited",
    "corpus_language": "en",
    "enabled": True,
    "beta": True,        # exibe badge BETA no frontend
    "rag_ready": False,  # muda para True após primeira ingestão bem-sucedida
    "prompt_file": "app.judge.prompts.swu",
    "confidence_profile": "swu",
    "crawler_url_env": "SWU_RULES_URL",   # URL vem do env, não hardcoded
}
```

### Modificar: `tcg_official_sources.py`

```python
# Adicionar crawler SWU com URL configurável:
async def crawl_swu(config) -> List[RawDocument]:
    url = config.SWU_RULES_URL
    if not url:
        logger.warning("SWU_RULES_URL não configurada. Skipping SWU crawl.")
        return []
    # Implementar crawler conforme estrutura real da URL
    # Suportar PDF download se URL terminar em .pdf
    ...
```

### Criar: `services/api/app/judge/prompts/swu.py`

```python
from app.judge.prompts._base import GamePrompt

PROMPT = GamePrompt(
    system_prompt="""Você é um árbitro de Star Wars Unlimited, o jogo de cartas colecionáveis
da Atomic Mass Games.

ESTRUTURA DO TURNO:
- Action Phase: jogadores se alternam tomando uma ação por vez.
- Ações possíveis: jogar uma carta, atacar, usar uma habilidade, passar.
- Quando ambos passam consecutivamente: fim da rodada.

COMBATE:
- Atacante declara o ataque (unidade ground ou space).
- Defensor pode escolher bloquear com uma unidade.
- Dano é resolvido simultaneamente.
- Unidades com dano >= HP são destruídas.

RECURSOS:
- Resources são pagos exaurindo (tapping) cartas de resource.
- Resources não-exauridos permanecem para próxima rodada (não há untap).

Cite as regras pelo número quando disponível. Responda em português brasileiro.""",
    few_shot_examples=[],  # adicionar após corpus indexado e revisado
)
```

### Adicionar a `tcg-brand.ts`

```typescript
swu: {
  name: "Star Wars Unlimited",
  emoji: "⭐",
  bgColor: "#0A0A1A",
  textColor: "#E0E0FF",
  subtextColor: "#8080C0",
  accentColor: "#FFE81A",  // amarelo Star Wars
  beta: true,
}
```

### Variável de ambiente

```python
SWU_RULES_URL: Optional[str] = Field(default=None, env="SWU_RULES_URL")
```

### Testes

Criar `tests/star_wars_unlimited/test_swu_registry.py`:
- Testa que `swu` está no registry com `rag_ready=False` por default
- Testa que crawler retorna `[]` quando `SWU_RULES_URL` não configurada
- Testa que `get_game_prompt("swu")` carrega sem erro

---

## Epic 5 — Analytics de crescimento

### Schema

Cria `supabase/migrations/20260521000002_judge_growth_analytics.sql`:

```sql
CREATE TABLE IF NOT EXISTS tcg_judge.judge_growth_metrics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game         TEXT,
  metric_type  TEXT NOT NULL,
  metric_value JSONB NOT NULL DEFAULT '{}',
  session_id   UUID,   -- anônimo: hash do fingerprint
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX growth_metrics_type_idx ON tcg_judge.judge_growth_metrics (metric_type, created_at DESC);
CREATE INDEX growth_metrics_game_idx ON tcg_judge.judge_growth_metrics (game, created_at DESC);

-- Política de retenção: dados brutos por 90 dias, agregados permanentes
-- Job semanal de arquivamento (ver docs/GROWTH_ANALYTICS_RETENTION.md)
CREATE TABLE IF NOT EXISTS tcg_judge.judge_growth_monthly_summary (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period       DATE NOT NULL,  -- primeiro dia do mês
  game         TEXT,
  metric_type  TEXT NOT NULL,
  total        BIGINT NOT NULL,
  unique_users BIGINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (period, game, metric_type)
);
```

**Política de retenção de dados — obrigatório:**

Criar `services/api/app/jobs/growth_metrics_archiver.py`:

```python
"""
Job semanal de arquivamento de métricas de crescimento.

Agrega métricas brutas com mais de 90 dias em judge_growth_monthly_summary.
Deleta registros brutos após agregação.

Executar via cron: todo domingo às 2h (ARCHIVER_CRON_SCHEDULE=0 2 * * 0).
"""

async def archive_old_metrics(db) -> dict:
    cutoff = "NOW() - INTERVAL '90 days'"

    # Agregar métricas antigas
    await db.execute(f"""
        INSERT INTO tcg_judge.judge_growth_monthly_summary
          (period, game, metric_type, total, unique_users)
        SELECT
          date_trunc('month', created_at)::DATE AS period,
          game,
          metric_type,
          COUNT(*) AS total,
          COUNT(DISTINCT COALESCE(user_id::TEXT, session_id::TEXT)) AS unique_users
        FROM tcg_judge.judge_growth_metrics
        WHERE created_at < {cutoff}
        GROUP BY 1, 2, 3
        ON CONFLICT (period, game, metric_type) DO UPDATE
          SET total = EXCLUDED.total + judge_growth_monthly_summary.total,
              unique_users = GREATEST(EXCLUDED.unique_users, judge_growth_monthly_summary.unique_users)
    """)

    # Deletar dados brutos arquivados
    result = await db.execute(f"""
        DELETE FROM tcg_judge.judge_growth_metrics WHERE created_at < {cutoff}
    """)

    return {"archived_rows": result}
```

### Eventos a registrar

No pipeline do Judge, registrar via `POST /runtime/judge/analytics` (internal, não exposto externamente):

| `metric_type`               | Quando registrar                          |
|-----------------------------|-------------------------------------------|
| `judge_question_sent`       | Ao iniciar processamento da query         |
| `share_created`             | Ao gerar link de compartilhamento         |
| `share_opened`              | Ao abrir `/judge?share=TOKEN`             |
| `session_restored`          | Ao restaurar sessão via deep link         |
| `related_question_clicked`  | Ao clicar em sugestão pós-veredito        |
| `history_opened`            | Ao abrir o histórico de conversas         |
| `login`                     | Ao completar login Google                 |
| `favorites_saved`           | Ao salvar uma resposta como favorita      |

### Frontend: aba Growth no dashboard

Adicionar aba "Growth" em `/observability` com:
- Cards de métricas: DAU / WAU / MAU, perguntas por sessão, CTR Related Questions
- Gráfico de top jogos por volume de queries (últimos 7/30/90 dias)
- Tabela: shares gerados vs shares abertos (taxa de abertura)

### Testes

Criar `tests/growth_metrics/test_analytics.py`:
- Testa inserção de evento `judge_question_sent`
- Testa job de arquivamento: métricas > 90 dias migradas para summary e deletadas
- Testa que dados anonimizados (sem user_id) são tratados por session_id

---

## Epic 6 — Melhorias de UX

### Empty State para utilizador novo

Em `JudgePageClient.tsx`, quando `history.length === 0`:

```tsx
const EXAMPLE_QUESTIONS: Record<string, string[]> = {
  mtg: [
    "Como funciona a habilidade Trample?",
    "O que é prioridade e quando ela passa?",
    "Posso ativar uma habilidade de tap no turno em que joguei a criatura?",
  ],
  yugioh: [
    "Como funciona uma chain no Yu-Gi-Oh?",
    "O que é Spell Speed e como afeta as chains?",
    "Quando posso ativar uma armadilha?",
  ],
  pokemon: [
    "Uma criatura que acabou de entrar pode evoluir?",
    "Como funciona o status Burned?",
    "Dano no bench aplica fraqueza?",
  ],
};
```

### Histórico agrupado por data

Modificar a lista de histórico para agrupar por: Hoje / Ontem / Últimos 7 dias / Mais antigos.

### Favoritos com schema definido

**Problema resolvido:** o schema `saved_answers` está definido no Epic 1 desta wave.

UI de favoritos:
- Botão estrela no `ResponseCard` (ao lado do `ShareVerdictButton` existente)
- `POST /api/judge/saved-answers` → salva na tabela `saved_answers`
- Aba "Favoritos" no `UserMenu` (só visível quando autenticado)
- Sem auth: favoritos no localStorage com chave `judge:favorites` (limite 20)

### Quick Actions

No `ResponseCard`, adicionar barra de ações rápidas:
- Copiar resposta (texto da resposta)
- Compartilhar (usa `ShareVerdictButton` existente)
- Favoritar (novo — usa `saved_answers`)
- Abrir primeira fonte citada (usa deep link do `SourceCard`)

---

## LGPD — Conformidade mínima obrigatória

**Esta seção é obrigatória para o go-live de qualquer feature de auth.**

### O que criar

**1. Página `/privacidade`:**
Conteúdo mínimo:
- Quais dados são coletados (nome, email do Google OAuth)
- Como são armazenados (Supabase — serviço terceiro)
- Por quanto tempo (até o utilizador deletar a conta)
- Como exercer direito de exclusão: `POST /api/judge/account/delete`

**2. Banner de consentimento no primeiro acesso:**

```tsx
// components/ConsentBanner.tsx
// Exibir quando localStorage.getItem("judge:consent") === null
// Ao clicar "Entendi": localStorage.setItem("judge:consent", "1")
// Link para /privacidade
```

**3. Endpoint de exclusão de conta:**

```python
@router.delete("/api/judge/account")
async def delete_account(user_id: str = Depends(get_current_user_id), db = Depends(get_db)):
    """LGPD: exclusão completa de dados do utilizador."""
    await db.execute("DELETE FROM tcg_judge.saved_answers WHERE user_id = $1", user_id)
    await db.execute("DELETE FROM tcg_judge.judge_growth_metrics WHERE user_id = $1", user_id)
    # Supabase Auth: delete via Admin API
    await supabase_admin.delete_user(user_id)
    return {"status": "deleted"}
```

**4. Assinar o Supabase DPA:**
Antes do go-live: acessar supabase.com/dpa e assinar o Data Processing Agreement.
Documentar em `docs/LGPD_COMPLIANCE.md`.

---

## Documentação a criar

```
docs/AUTHENTICATION_GUIDE.md         — setup Supabase Auth, variáveis de env
docs/SHARED_VERDICTS.md              — geração de tokens, rotação de secrets
docs/RELATED_QUESTIONS.md            — estratégia heurística vs LLM
docs/STAR_WARS_UNLIMITED_SUPPORT.md  — configuração SWU_RULES_URL, fallback PDF
docs/GROWTH_ANALYTICS.md            — eventos, retenção 90 dias, aggregation job
docs/LGPD_COMPLIANCE.md             — política de privacidade, DPA Supabase
docs/RATE_LIMITING.md               — limites por auth status, configuração
```

---

## Critérios de aceitação da Wave 2B

- Login Google funcional via Supabase Auth
- Histórico do localStorage migrado para cloud no primeiro login (sem duplicatas)
- Sem auth ou com Supabase indisponível: localStorage continua funcionando
- Deep links `?session=UUID` restauram conversas completas
- OG image gerada para links compartilhados (verificar com opengraph.xyz)
- Tokens de compartilhamento validam com `current_secret` e `previous_secret`
- Rate limit: anônimos 20 req/min, autenticados 60 req/min
- Related Questions: heurística usada quando ≥ 2 rule_atoms; LLM como fallback
- Perguntas relacionadas pré-populam input (NÃO enviam automaticamente)
- SWU disponível no seletor com badge BETA; `rag_ready=false` até ingestão
- Crawler SWU usa `SWU_RULES_URL` do env, não URL hardcoded
- Métricas brutas arquivadas após 90 dias no summary mensal
- Banner de consentimento LGPD exibido no primeiro acesso
- Endpoint `DELETE /api/judge/account` remove todos os dados do utilizador
- Favoritos persistem em `saved_answers` (autenticado) ou localStorage (anônimo)
- `ruff check .` sem erros
- `pytest tests/auth tests/judge_related_questions tests/star_wars_unlimited tests/growth_metrics -q` — todos verdes
- Zero regressões nas waves anteriores
