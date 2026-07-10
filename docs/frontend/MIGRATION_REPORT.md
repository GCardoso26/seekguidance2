# Migration Report — UI Premium Polish

**Data:** 2026-07-10  
**Tipo:** migração visual / tokens (sem schema, sem API)

---

## Tokens criados

| Token | Valor / uso |
|-------|-------------|
| `--text-h4` | Heading S (1.0625rem) |
| `--text-body-lg` | Body Large |
| `--mobile-nav-offset` | 4.5rem sticky buyer |
| `--control-height` / `-sm` / `-lg` | 36 / 32 / 40px |
| `--transition-fast/base/slow` | 150 / 200 / 250ms |
| Dark `--*-foreground` success/warning/danger | contraste |

## Utilities / Tailwind criados

- `.text-h4`, `.text-body-lg`, `.text-label`, `.text-hint`
- `.sticky-mobile-bar`
- `fontSize.h4`, `body-lg`, `label`, `hint`
- `spacing.nav-offset`
- `transitionDuration.fast|base|slow`

## Tokens / padrões removidos (hotspots)

| Removido | Substituído por |
|----------|-----------------|
| `text-white` (empty/table) | `text-foreground` |
| `border-white/15` | `border-border` |
| `hover:bg-white/[0.03]` | `hover:bg-muted/40` |
| `bg-white/[0.04]` | `surface-card` / `bg-muted/40` |
| `bg-black/20` (filtros) | `bg-card` |
| `bg-black/50` (wishlist) | `bg-card/90` |
| `from-luxury-gold/10 to-luxury-onyx` | `from-primary/5 to-background` |
| `border-luxury-gold/*` (insights) | `border-primary/*` |
| `shadow-lg` (buy panel / sticky) | `shadow-card` |
| `text-red-500` (drawer) | `text-danger` |
| Status `emerald/amber/blue-200` | Badge `success/warning/secondary` |
| Emoji ☰ 🔍 | Lucide Menu / Search |

## Componentes migrados / refinados

1. `components/ui/async-state.tsx`
2. `components/ui/button.tsx`
3. `components/seller-dashboard/EmptyState.tsx`
4. `components/seller-dashboard/DataTable.tsx`
5. `components/seller-dashboard/SaleStatusBadge.tsx`
6. `components/seller-dashboard/SellerPanelTopBar.tsx`
7. `components/admin/AdminPanelTopBar.tsx`
8. `components/checkout/CheckoutProgressBar.tsx`
9. `components/cards/CardBuyPanel.tsx`
10. `components/cards/CardDetailPage.tsx` (sticky bar)
11. `components/cart/CartDrawer.tsx`
12. `app/marketplace/cart/page.tsx` (sticky)
13. `components/marketplace/MarketplaceFirstLanding.tsx`
14. `components/marketplace/WishlistButton.tsx`
15. `components/marketplace/product-filters/FilterFields.tsx`
16. `components/seller-dashboard/overview/DashboardKpiStrip.tsx`
17. `components/seller-dashboard/overview/MetricCardsRow.tsx`
18. `components/seller-dashboard/overview/StickyQuickActionsBar.tsx`
19. `components/seller-dashboard/overview/OperationalCommandCenter.tsx`
20. `components/seller-dashboard/overview/WorkspaceSettings.tsx`
21. `components/seller-ai/SellerInsightsPage.tsx`
22. `styles/design-tokens.css`
23. `styles/globals.css`
24. `tailwind.config.ts`

## Ainda não migrados (amostra)

- `JudgeEmptyState`, `EmptyTableState`, `Toast`
- `StoreHealthScoreWidget`, `PricingCard`
- `seller-dashboard` forms com `surface-card` input
- Massa `text-xs` / `luxury-*` (~70+ files produto)
- `ui/data-table` ↔ seller DataTable merge

## Impacto em runtime

- Sem mudanças de API, rotas, feature flags ou schema.
- CLS: sticky unificado reduz salto de barras mobile.
- Bundle: neutro (só classes CSS).
