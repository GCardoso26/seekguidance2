# Bundle Reduction — Sprint 19

**Data:** 2026-07-13

## Metas vs real

| Etapa | Meta | Real |
|---|---:|---:|
| Baseline | 342 KB | 342 KB |
| Intermediário | 250 / 220 | — |
| Alvo | **&lt;200 KB** | **341 KB** |

## Por quê o shared não caiu para &lt;200 KB

First Load shared ≈ soma de chunks framework Next/React (~217 + 54 + 66 KB).  
Isso é o **piso** do App Router Next 15 + React 19 neste monólito. Remover Cart/Search/Upgrade do root **não** reduz esse piso; reduz hidratação e chunks de área.

## Ações de redução

1. `optimizePackageImports` (mantido)
2. Provider shells por área
3. Home RSC + `dynamic(ssr:false)` seções abaixo da dobra
4. Command palette / charts / seller widgets já dynamic (18.5)

## First Load por rota (build Sprint 19)

| Rota | First Load |
|---|---:|
| Shared | **341 KB** |
| `/` | ~517 KB |
| `/loja` | ~512 KB |
| `/checkout` | ~531 KB |
| `/comprador` | ~509 KB |
| `/vendedor/painel` | ~466 KB |

## Separação por área

| Área | Shell | Isola |
|---|---|---|
| Marketplace | `MarketplaceProviders` | Cart, Search, Upgrade, PWA |
| Seller | `SellerProviders` | Search, Upgrade |
| Judge | `JudgeProviders` | Upgrade |
| Root | `MinimalProviders` | Theme, Auth, Query |

## Dívida

Shared &lt;200 KB exige mudança estrutural (multi-app, edge lighter, ou Auth/Query sob demanda com risk de UX) — **fora do escopo seguro RC1**.
