# Provider Architecture — Sprint 19

**Data:** 2026-07-13

## Antes (Sprint 18.5)

```
RootLayout (RSC)
└─ AppProviders (client)
   Theme → Auth → Query → Upgrade → Cart → Search → LuxurySiteShell
   (+ PWA + Toaster)
```

| Provider no root | Necessário globalmente? |
|---|---|
| ThemeProvider | Sim |
| AuthProvider | Sim (session ampla) |
| QueryProvider | Sim (React Query) |
| UpgradeModalProvider | **Não** |
| CartProvider (CartDrawer) | **Não** |
| SearchPlatformProvider | **Não** |
| LuxurySiteShell | Condicional (pathname) |

**Quantidade no root:** 7 camadas client

## Depois (Sprint 19)

```
RootLayout (RSC)
└─ MinimalProviders
   Theme → Auth → Query → ErrorBoundary → LuxurySiteShell → Toaster

Home / Loja / Checkout / Marketplace / Comprador / Decks / Carrinho / Wishlist
└─ MarketplaceProviders
   Upgrade → Cart → Search (+ PWA)

/vendedor/painel/*
└─ SellerProviders
   Upgrade → Search

/regras/*
└─ JudgeProviders
   Upgrade
```

| Área | Providers |
|---|---|
| Root | 3 (+ shell) |
| Marketplace | +3 |
| Seller | +2 |
| Judge | +1 |

**Providers movidos do root:** Cart, Search, Upgrade, PWA (4)

## Impacto no bundle

| Métrica | Antes | Depois |
|---|---:|---:|
| First Load JS shared | 342 KB | **341 KB** |
| Floor Next/React (~217+54+66) | ~337 KB | ~337 KB |

O shared permanece dominado pelo runtime Next 15 + React 19. A decomposição **isola** cmdk/CartDrawer/UpgradeModal nos chunks de área (não no grafo mínimo), melhorando code-splitting em navegação e hidratação inicial de rotas admin/seller leves.

**Meta &lt;200 KB shared:** não atingível sem mudar framework / reduzir Auth+Query do root (quebra sessão/UX). Documentado como dívida estrutural.

## useUpgradeModal

Sem provider → no-op (antes throw). Seguro em páginas sem `JudgeProviders`/`MarketplaceProviders`.
