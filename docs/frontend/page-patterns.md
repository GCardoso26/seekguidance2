# Page Patterns — JudgeTCG

## Consumer app (`MobileLayout`)

**Rotas:** `/`, `/loja/*`, `/comprador`, `/perfil`, `/marketplace/*`

```
┌─────────────────────────────────────┐
│ GlobalHeader (busca + nav + ações)  │
├─────────────────────────────────────┤
│ page-container                      │
│   ┌─ page header (h1 + actions) ─┐  │
│   ┌─ content grid / list ────────┐  │
│   └──────────────────────────────┘  │
├─────────────────────────────────────┤
│ Bottom nav (mobile only)            │
└─────────────────────────────────────┘
```

### Page header pattern

```tsx
<div className="page-container">
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-h1">Título</h1>
      <p className="mt-1 text-muted-foreground">Descrição</p>
    </div>
    <Button>Ação</Button>
  </div>
  {/* content */}
</div>
```

## Seller panel

**Layout:** `vendedor/painel/layout.tsx` + `Sidebar` + `SellerPanelTopBar`

```
┌──────────┬──────────────────────────┐
│ Sidebar  │ TopBar                   │
│ (240px)  ├──────────────────────────┤
│          │ Workspace content        │
│          │ KPI strip → widgets      │
└──────────┴──────────────────────────┘
```

KPI strip: grid `sm:grid-cols-2 lg:grid-cols-4` com `Surface variant="elevated"`

## Admin panel

Mesmo shell que seller, nav em `admin-sidebar-nav.ts`

## Buyer dashboard

**Rota:** `/comprador`  
**Componente:** `BuyerDashboardPage.tsx`

- Grid de `StatCard` (Surface interactive)
- Seções: pedidos recentes, wishlist, insights
- Empty state com CTA login quando não autenticado

## Marketplace browse

**Rotas:** `/loja`, `/loja/busca`, `/marketplace/produtos`

- Filtros: sidebar desktop, drawer mobile
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`
- Cards: `ProductCard` ou `CardCard`
- Loading: `SkeletonCard` grid
- Empty: `ProductEmpty` ou `PageEmpty`

## Product detail

**Rotas:** `/marketplace/product/[id]`, `/loja/.../cartas/[cardId]`

```
Desktop:
┌─────────────┬──────────────┐
│ Image hero  │ Buy panel    │
│ (sticky)    │ (sticky)     │
├─────────────┴──────────────┤
│ Tabs: info · offers · hist │
└────────────────────────────┘
```

## Checkout

**Rota:** `/marketplace/checkout`

- Steps visuais (carrinho → frete → pagamento)
- `Surface` para cada seção
- Resumo sticky à direita (desktop)

## Wishlist

**Rota:** `/wishlist`  
Componente: `WishlistPage.tsx` — lista com DND, usar `Surface` por item

## Judge / Rules

Mantém `judge-tcg.css` para mesa e chips — alinhado via `tcg-theme.ts`

## Loading pattern

```tsx
if (isLoading) return <SkeletonDashboard />;
if (error) return <PageError onRetry={refetch} />;
if (!data?.length) return <PageEmpty title="..." action={{ label: "...", href: "..." }} />;
```

## Spacing entre seções

- Entre seções: `space-y-8` ou `gap-8`
- Dentro de cards: `p-5` (md padding)
- Entre form fields: `gap-4` via `FormField` wrapper
