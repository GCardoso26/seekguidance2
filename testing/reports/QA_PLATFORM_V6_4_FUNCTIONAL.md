# QA PLATFORM V6.4 — FUNCTIONAL REGRESSION CERTIFICATION

**Campaign:** Platform V6.4  
**Mode:** ZERO FEATURE · ZERO REFACTOR · ZERO CLEANUP  
**Date:** 2026-07-23  
**Scope:** Correção exclusiva de regressões funcionais (As-Is)

## Verdict

| Gate | Value |
|------|-------|
| **READY_FOR_PRODUCTION** | **FALSE** |

Motivo: correções aplicadas no código e validadas por unit tests; **deploy em produção ainda necessário** para fechar V6.4-003 (Image `qualities`) e revalidar E2E contra `judgetcg.com.br`. Até evidência pós-deploy, o gate permanece fechado.

## Bugs

| ID | Título | Status | Causa raiz | Correção |
|----|--------|--------|------------|----------|
| V6.4-001 | Contraste ilegível nos portais | **FIXED (code)** | CTA `.game-cta` com `color:#fff` em primaries claras (Pokémon/SWU/…); tokens Tailwind (`--foreground`) não sincronizados com `--game-text` no portal | `--game-cta-fg` via contraste WCAG; sync `--foreground`/`--muted-foreground`/… em `gameThemeCssVars` |
| V6.4-002 | Marketplace filtros ilegíveis | **FIXED (code)** | Inputs/selects/labels sem `text-foreground` explícito | `FilterFields` + `MarketplaceFiltersAdvanced` usam `text-foreground` / `accent-primary` |
| V6.4-003 | Imagens quebradas (`/_next/image` 400) | **FIXED (code)** · **PENDING DEPLOY** | Next 15 `images.qualities` omitia `60` e `78` usados por `ResponsiveImage` / cards | Allowlist `[60,70,75,78,80,85,90,100]` |
| V6.4-004 | Botões → páginas erradas | **FIXED (code)** | `marketplaceCategoryHref` → `/marketplace?…` redireciona para `/loja` e descarta filtros | Base `/marketplace/produtos`; hrefs diretos alinhados |
| V6.4-005 | Marketplace sem produtos (acessórios) | **PARTIAL** | Redirect (004) + inventário quase só `single` (1 sleeve com `tcg_id` inválido) | Routing corrigido; listagem singles OK (`total≈13571`); acessórios dependem de inventário (sem alteração de DB/API) |
| V6.4-006 | Navegação funcional completa | **IN PROGRESS** | Depende de deploy + E2E prod | Spec `qa-platform-v6-4-functional.spec.ts` criada |

## Ruído no console (não-bloqueante de app core)

| Sintoma | Classificação |
|---------|---------------|
| Cloudflare Insights SRI `beacon.min.js` integrity mismatch | Infra CF Web Analytics — fora do app |
| `POST …/vitals` failed | Telemetria — soft-fail |
| `GET /api/tournament-platform/events` 401 | Já soft-fail via `softJson`; eventos públicos vazios |
| `[Violation] setTimeout` / forced reflow | Performance noise — fora do escopo ZERO FEATURE |

## Evidências

- Unit: `tests/lib/game-theme-v2.test.ts`, `tests/lib/tcg-product-categories.test.ts` — **PASS**
- Prod repro (pré-fix): `q=60`/`q=78` → **400**; `q=70` → **200**; raw `/logos/mtg.webp` → **200**
- Prod API: `GET /api/marketplace/products` → produtos; `category=sleeve` → 1 item; `category=sleeve&game_id=MTG` → 0 (inventário)

## Artefatos

- `QA_PLATFORM_V6_4_EVIDENCE.json`
- `BUG_BACKLOG_V6_4.md`
- `UX_REGRESSION_REPORT.md`
- `THEME_VALIDATION.md`
- `MARKETPLACE_VALIDATION.md`
- `ROUTING_VALIDATION.md`
- `IMAGE_PIPELINE_VALIDATION.md`
- E2E: `frontend/runtime_console_v3/e2e/specs/qa-platform-v6-4-functional.spec.ts`

## Reopen rule

Qualquer regressão funcional reproduzível após deploy **reabre** automaticamente:

`READY_FOR_PRODUCTION = FALSE`
