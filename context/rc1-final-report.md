# RC1 Final Report — pós RC1.2 Quality Gates Recovery

**Data:** 2026-07-14  
**Escopo:** RC1.1 Store Perf + RC1.2 A11y/BP  
**Decisão:** **RC1 BLOCKED**

---

## Before / After (lab desktop)

| Gate | RC1.1 Store | RC1.2 lab | Meta |
|---|---:|---:|---|
| Performance `/loja` | 97–98 | **97** | ≥95 |
| Accessibility `/loja` | **96** | **100** | ≥98 |
| Best Practices `/loja` | **96** | **100** | =100 |
| SEO `/loja` | 100 | **100** | =100 |
| LCP `/loja` | 1.2–1.3s | **1.3s** | &lt;2s |
| CLS `/loja` | 0 | **0** | &lt;0.05 |

Home: A11y **96→100**, BP **100**, Perf **100**.  
Bateria crítica (`/`, `/loja`, cart, checkout, comprador, decks): A11y **100**, BP **100**, SEO **100**.

---

## Console errors removed

- `/api/analytics/track` 400/503 → soft **200**
- `/api/catalog/sets` 503 → soft **200** `{sets:[]}`
- `/api/catalog/cards/search` 503 → soft **200** empty

LH `errors-in-console` = **1** em todas as rotas lab.

---

## Accessibility / contrast / ARIA

- Token `--warning-500` WCAG AA (~5:1) — fix do rating `0.0` na home
- Contraste Store path PASS (A100)
- Sem falhas weighted de landmark/heading na bateria pós-fix
- Keyboard / screen reader: sem blockers medidos (ver reports)

---

## Source maps / third-party

- `productionBrowserSourceMaps: true` → `valid-source-maps` score 1
- Third-party: Stripe lazy; Vercel Analytics/Insights no root layout — sem console errors no lab RC1.2

---

## Dívida técnica restante

| Item | Impacto |
|---|---|
| `/loja/busca` Perf **86** | Fora da lista crítica P1-6; A/BP/SEO 100 |
| Source map column warnings | Cosmético |
| Prod sem deploy RC1.1+RC1.2 | **Bloqueia tag** |
| CI GitHub Actions billing (B1) | **Bloqueia evidência CI remota** |
| Seller guest LH → `/entrar` | Auth wall; página login A/BP 100 |

---

## Production vs Local

| | Local RC1.2 | Production (`judgetcg.com.br`, artefato pré-ship) |
|---|---|---|
| A11y `/loja` | **100** | ~93 |
| BP `/loja` | **100** | 96 |
| Perf `/loja` | **97** | ~77 |
| LCP `/loja` | 1.3s | ~4–5s |

Detalhe: `docs/frontend/PRODUCTION_VALIDATION.md`.

---

## RC1 Decision (pós-deploy 2026-07-14)

❌ **RC1 STILL BLOCKED**

Evidência:

1. Deploy production **READY** (`dpl_85fQfyC21x1kipBK1nC14P18EG1D` → `judgetcg.com.br`).
2. Store prod `/loja`: **P100 A100 BP100 SEO100 LCP 0.7s** — PASS.
3. Smoke **34/34**; health BFF/API **200**.
4. **FAIL:** `/checkout` Perf **91** (&lt;95), LCP **2.0s** (meta &lt;2s).
5. CI API/Quality Gates/Security ainda vermelhos (Ruff/TruffleHog) — frontend+LH+Vercel hook OK.

Detalhe operacional: `context/release/RC1_DEPLOYMENT_REPORT.md`.
