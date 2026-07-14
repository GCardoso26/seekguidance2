# Store Architecture — RC1.1

**Data:** 2026-07-14  
**Rota:** `/loja` (Store hub)

## Mapa

```
loja/layout.tsx (RSC) + StoreProviders (client)
└─ loja/page.tsx (RSC)
   └─ MobileLayout (client)
      ├─ GlobalHeader (client) — search, mega-menu, cart CTA, auth
      ├─ Hero estático RSC (h1, copy, CTAs via Button/Link)
      ├─ LojaMarketplaceAlert (client island + Suspense)
      ├─ Breadcrumbs (RSC-capable)
      └─ GameGridStream (RSC + Suspense)
         ├─ fallback: GameGridBootstrap (RSC, MOCK)
         └─ GameCard (RSC) × N
```

## Classificação

| Componente | Tipo | Hydration | Bundle | Nota |
|---|---|---|---|---|
| `loja/page.tsx` | RSC | 0 | baixíssimo | |
| `loja/layout.tsx` | RSC | 0 | — | metadata + StoreProviders |
| `StoreProviders` | Client | baixo | Search + CartDrawer lazy | Sem UpgradeModal |
| `MobileLayout` | Client | alto | header+nav | Shell buyer compartilhado |
| `GlobalHeader` | Client | alto | search/auth/mega | Necessário nav |
| `GameGrid` (legado client) | **Removido do hub** | — | — | Substituído por RSC |
| `GameGridRsc` | RSC + Streaming | 0 | server | |
| `GameCard` | RSC | 0 | next/image | logos WebP |
| `LojaMarketplaceAlert` | Client island | mínimo | useSearchParams | |
| CartDrawer | dynamic ssr:false | on-demand | | |
| Charts / AI / Seller | **não no path** | | | |

## Diff vs Sprint 19 (antes RC1.1)

| Antes | Depois |
|---|---|
| `GameGrid` client + `/api/games` waterfall | RSC bootstrap + stream health |
| `MarketplaceProviders` (Upgrade+Cart sync) | `StoreProviders` (Search + lazy Cart) |
| Logos SVG até **4 MB** via `/_next/image` | WebP ~2–4 KB |
| LCP 4.2–4.4s | **1.2–1.3s** (medido) |
| Perf 74 | **97–98** (medido) |
