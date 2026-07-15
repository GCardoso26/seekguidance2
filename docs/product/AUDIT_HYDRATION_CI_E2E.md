# Auditoria: hidratação #418, CI gate e e2e

**Data:** 2026-07-14  
**Escopo:** home `/`, gate Vercel `frontend-quality`, subset Playwright smoke.

## Resultados locais

### Vitest (gate)

```bash
npm run test --workspace=runtime-console-v3 -- tests/lib/format-count.test.ts
```

| Suite | Resultado |
|---|---|
| `formatCountStable` + `MOCK_CATALOG_HEALTH` estável | **PASS** (2 tests) |

### Playwright (chromium)

```bash
cd frontend/runtime_console_v3
npx playwright test \
  e2e/specs/home-hydration.spec.ts \
  e2e/specs/header-navigation.spec.ts \
  e2e/specs/auth-flow.spec.ts \
  e2e/specs/global-search.spec.ts \
  e2e/specs/marketplace-filters.spec.ts \
  e2e/specs/cardtrader-navigation.spec.ts \
  --project=chromium
```

| Spec | Resultado | Notas |
|---|---|---|
| `home-hydration.spec.ts` | **PASS** | Sem "Algo deu errado"; contagem `^\d{1,3}(\.\d{3})*$`; sem #418/#425 no console |
| `header-navigation.spec.ts` | **PASS** | |
| `auth-flow.spec.ts` | **PASS** | |
| `global-search.spec.ts` | **PASS** | |
| `cardtrader-navigation.spec.ts` | **PASS** | |
| `marketplace-filters.spec.ts` | **FAIL** (pré-existente) | URL sem `max_price=500`; mobile timeout em `marketplace-filters-apply` |

**Resumo:** 17 passed / 2 failed (falhas só em `marketplace-filters`, fora do fix de hidratação).

## Bugs / achados nesta auditoria

1. **Corrigido:** mismatch de `toLocaleString` + MOCK `last_sync` dinâmico + health `total_cards: 0` pós-hydrate (P0).
2. **Corrigido:** GameMegaMenu sem skeleton; ProductCard `Date.now()` no SSR; telemetria #418 (P1).
3. **Pré-existente:** filtros marketplace não persistem `max_price` na URL / botão apply mobile flaky — dívida e2e, não gate de prod nesta fase.
4. **Pré-existente (GHA, documentado):** Playwright CI timeout; API ruff/`test_intelligence` — path-filter agora skips jobs irrelevantes em docs-only / FE-only.

## CI / deploy

| Item | Status |
|---|---|
| `vercel-deploy-hook.yml` → `deploy` needs `frontend-quality` | Implementado |
| Path-filters em `ci.yml` / `quality-gates.yml` | Implementado (`dorny/paths-filter@v3`) |
| Branch protection `frontend-quality` em `main` | **Manual** — checklist em `docs/release/VERCEL_DEPLOYMENT.md` |
| Playwright/Lighthouse no gate de prod | **Não** (mantido nightly/sinalização) |

## Docs relacionados

- `docs/product/HYDRATION_418_FIX.md` — o que foi corrigido vs residual
- `docs/release/VERCEL_DEPLOYMENT.md` — checklist branch protection
