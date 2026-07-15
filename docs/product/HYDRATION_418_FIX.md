# Hydration #418 — correções e residual

**Data:** 2026-07-14  
**Sintoma:** React hydration mismatch (#418) na home → ErrorBoundary → card "Algo deu errado".

## Corrigido nesta leva

| Área | Mudança |
|---|---|
| Contagem no hero | `formatCountStable` (separador `.` fixo, sem ICU) em `MarketplaceHeroSearch`, `MarketplaceFirstLanding`, `CatalogMarketplaceSection`, `GameSelector` |
| MOCK health | `last_sync.MTG` ISO constante; `total_cards` = soma de `by_game` |
| Client health | `useCatalogHealth` mantém MOCK se resposta `degraded` / `total_cards <= 0` |
| GameMegaMenu | `dynamic` com skeleton de loading (padrão GlobalSearchBar) |
| ProductCard | badge "Novo" só após `mounted` (evita `Date.now()` no SSR) |
| Telemetria | `HydrationMismatchWatcher` em `MinimalProviders` — reporta #418/#425 via `page_view` |

## Residual (fora do escopo desta leva)

- Outros `toLocaleString("pt-BR")` em páginas não-home (GameHubPanel, grids, etc.) — risco menor se só client
- Branch protection no GitHub UI (obrigar check `frontend-quality`)
- Cold start Render / cron checkout 401
- LuxuryHeader `<a><button>` inválido HTML
- Playwright completo no GHA (timeouts pré-existentes)

## Como validar

```bash
npm run test --workspace=runtime-console-v3
cd frontend/runtime_console_v3 && npx playwright test e2e/specs/home-hydration.spec.ts
```
