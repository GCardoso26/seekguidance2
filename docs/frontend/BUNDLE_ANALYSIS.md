# Bundle Analysis — Sprint 18.5

**Data:** 2026-07-13  
**Ambiente:** `frontend/runtime_console_v3` · `next build` (pós-hardening)  
**Ferramenta:** inventário `.next/static/chunks` + `@next/bundle-analyzer` instalado (`npm run analyze`)

## Resumo executivo

| Métrica | Valor |
|---|---:|
| First Load JS shared | **342 KB** |
| Home First Load | **511 KB** |
| `/loja` First Load | **512 KB** |
| `/checkout` First Load | **532 KB** |
| `/vendedor/painel` First Load | **467 KB** |
| Maior chunk | **801 KB** (`15edc7c2-…js` — framework/runtime agregada) |

O shared bundle (~342 KB) continua o principal gargalo para P≥95 em rotas marketplace-first.

## Top 50 módulos (chunks em disco)

| # | Peso | Origem (chunk) | Ação realizada / nota |
|---|---:|---|---|
| 1 | 801.1 KB | `15edc7c2-…js` | Runtime/Next shared — sem alteração de contrato |
| 2 | 360.5 KB | `989-…js` | App chunk pesado (providers / marketplace) — split parcial via `dynamic()` |
| 3 | 347.0 KB | `44692.…js` | Dep. grande (vendor) — monitorar com `ANALYZE=true` |
| 4 | 239.5 KB | `90018-…js` | Shared app |
| 5 | 178.5 KB | `framework-…js` | React/Next framework |
| 6 | 177.1 KB | `56201-…js` | Feature chunk |
| 7 | 169.0 KB | `87c73c54-…js` | Shared polyfill/helpers |
| 8 | 153.2 KB | `main-…js` | Main client entry |
| 9 | 129.6 KB | `79623-…js` | Route/feature |
| 10 | 119.9 KB | `59c6eb5a.…js` | Async chunk |
| 11 | 110.0 KB | `polyfills-…js` | Polyfills Next |
| 12–50 | 14.8–66.2 KB | demais chunks | Ver `docs/frontend/_bundle_top50.txt` |

Lista completa gerada por `node scripts/list-bundle-top.js`.

## Dependências grandes identificadas

| Pacote | Evidência | Ação |
|---|---|---|
| `recharts` | PriceChart / SalesChart / AdminAnalytics | `dynamic(..., { ssr: false })` + `optimizePackageImports` |
| `framer-motion` / `gsap` | Luxury / Judge | LuxuryLayout carregado só quando shell ≠ `none`; motion via `lib/motion.ts` |
| `cmdk` | GlobalCommandPalette | `dynamic` + montagem apenas com `open` |
| `@stripe/react-stripe-js` | Checkout | Mantido no route chunk (necessário no fluxo) |
| `firebase` / `@sentry/nextjs` | Auth / observability | Sentry já lazy-init; sem mudança de contrato |

## Duplicações / imports desnecessários

- Command Palette não entra mais no grafo inicial se a busca global estiver fechada.
- `LuxuryLayout` + CSS luxury não carregam em rotas `variant === "none"` (`/`, `/loja`, checkout, painéis).
- `PriceChart` / valuation / judge insights no card detail agora são async.

## Ações realizadas nesta sprint

1. Instalado `@next/bundle-analyzer` + script `npm run analyze`.
2. `experimental.optimizePackageImports` para lucide, recharts, framer-motion, radix, cmdk, sonner, virtual.
3. Dynamic imports: palette, charts, seller AI/drawer/reputation, catalog section, card detail heavy tabs.
4. `/loja` migrada de page client → RSC + isla `LojaMarketplaceAlert`.
5. Font Inter reduzida (removido weight 300).

## Dívida restante (bundle)

- Shared First Load **342 KB** ainda acima do ideal enterprise (~150–200 KB).
- `MarketplaceFirstLanding` permanece client (hidratação do hero).
- Providers globais (Auth/Query/Cart/Theme) no root — refactor de árvore exigiria fase dedicada sem risk de regressão UX.
