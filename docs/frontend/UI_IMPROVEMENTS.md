# UI Improvements — aplicado nesta sessão

**Data:** 2026-07-10  
**Regra:** apenas UI — zero mudanças de lógica, APIs ou bounded contexts.

---

## Resumo

| Métrica | Valor |
|---------|------:|
| Arquivos UI tocados | ~25 |
| Primitivos refinados | 6 |
| Tokens novos | 12+ |
| Classes luxury/hardcoded removidas (hotspots) | ~40 |
| Nota estimada | 8.0 → **8.6** |

---

## Melhorias aplicadas

### Design tokens & globals
- Escala tipográfica: `h4`, `body-lg`, `label`, `hint`
- Spacing documentado (escala 4–64)
- `--mobile-nav-offset`, `--control-height*`, `--transition-*`
- Dark: `--success-foreground`, `--warning-foreground`, `--danger-foreground`
- Utilities: `.text-h4`, `.text-body-lg`, `.text-label`, `.text-hint`, `.sticky-mobile-bar`
- Tailwind: `fontSize` + `spacing.nav-offset` + `transitionDuration`

### Primitivos
| Componente | Mudança |
|------------|---------|
| `async-state` | Empty/error/alert theme-safe; tipografia tokens; Button asChild |
| `EmptyState` (seller) | `text-foreground` + dashed `border-border` + ícone |
| `DataTable` (seller) | surface-card, hover muted, empty dashed, sticky default |
| `SaleStatusBadge` | Badge variants semânticos |
| `Button` | `text-small`/`text-caption`; loading inline; `duration-base` |
| `CheckoutProgressBar` | `shortLabel` visível no mobile |

### Buyer / marketplace
- Landing: gradient `primary/5` → `background`
- Filtros: `bg-card` + `focus-ring` (sem `bg-black/20`)
- WishlistButton: `bg-card/90` theme-aware
- CardBuyPanel: `shadow-card` + `rounded-xl`
- Cart sticky: `.sticky-mobile-bar`
- Card detail sticky bar: token + `shadow-card`
- CartDrawer: overlay `foreground/50`, touch `h-9`, `text-danger`

### Seller / admin
- TopBars: Lucide `Menu` / `Search` (sem emoji)
- KPI strip + MetricCards + QuickActions + CommandCenter + Workspace: tokens muted
- Insights: `border-border` / `border-primary` (sem luxury-gold)

---

## Antes → Depois (percepção)

| Antes | Depois |
|-------|--------|
| Empty panel ilegível em light (`text-white`) | Empty theme-safe |
| Tabela seller “dark-only” | Tabela Stripe-like |
| Status emerald/amber raw | Badge DS |
| Sticky mobile desalinhado | `--mobile-nav-offset` |
| Emoji ☰ 🔍 no chrome | Lucide consistente |
| Inputs filtro `bg-black/20` | Controles DS |
| Cards KPI `bg-white/[0.04]` | `surface-card` / `bg-muted/40` |

---

## Não feito (próxima leva P0/P1)

- Hero duplicado na home da loja
- Chrome triplo SellerHeader + PageHeader
- Inputs `surface-card` em Tickets/Listings
- Purge massivo `text-xs` / `luxury-*`
- Unificar `ui/data-table` ↔ seller DataTable
- Judge portal theme-safe completo
- Finance chart tokens

Ver `DESIGN_DEBT.md` e roadmap em `UX_SCORECARD.md`.
