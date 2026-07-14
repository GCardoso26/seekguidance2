# Hydration Report — Sprint 19

**Data:** 2026-07-13  
**Método:** code audit + First Load JS + Lighthouse TBT (lab)

## Resumo

| Métrica | Antes (18.5) | Depois (19) |
|---|---|---|
| Providers no root | 7 | **3** (+ LuxurySiteShell) |
| Home | Client monolith | **RSC + islands** |
| `/loja` | RSC + clients | Mantido |
| Comprador CLS | 0.315 | **0** (local lab) |
| Shared JS | 342 KB | 341 KB |

## Componentes críticos

| Componente | Tipo | Hydration | Solução aplicada |
|---|---|---|---|
| `MarketplaceFirstLanding` | Client monólito | Alto | Substituído por `MarketplaceHomeRsc` (RSC) |
| `MarketplaceHeroSearch` | Client island | Médio | Mantido (busca) |
| `MarketplaceHomeInteractiveSections` | dynamic ssr:false | Lazy | Tendências/shops fora do critical path |
| `PopularGamesStream` | RSC + Suspense | — | Stream pós-hero |
| `MobileLayout` / `GlobalHeader` | Client | Alto (todas rotas buyer) | Inevitável no shell atual |
| `CartProvider` | Client | Médio | **Fora do root** → MarketplaceProviders |
| `SearchPlatformProvider` | Client + cmdk | Alto | Fora do root; palette só com `open` |
| `UpgradeModalProvider` | Client | Baixo–médio | Shells de área |
| `BuyerDashboardPage` | dynamic | Médio | Skeleton min-h + ssr:true |
| `AppProviders` legacy | — | — | Alias → MinimalProviders |

## Client Components eliminados / convertidos

| Item | Ação |
|---|---|
| Home page body (why/CTA/teasers/games markup) | **RSC** |
| Hero stats fetch bloqueante | Removido do critical path (mock + stream) |
| Root Cart/Search/Upgrade | Removidos do root |

## Re-renders / contextos

- Auth + Query permanecem root (sessão).
- `useUpgradeModal` sem provider → no-op (sem throw).
- Sem over-memoization adicionada.
