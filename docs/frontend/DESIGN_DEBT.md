# Design Debt — JudgeTCG

**Atualizado:** 2026-07-10  
**Severidade:** P0 bloqueia percepção premium · P1 consistência · P2 polish

---

## Dívida ativa

### P0 restante

| ID | Item | Onde | Esforço |
|----|------|------|---------|
| D-01 | Hero duplicado marketplace | `MarketplaceFirstLanding` + `CatalogMarketplaceSection` | S |
| D-02 | Chrome triplo (TopBar+SellerHeader+PageHeader) | Finance, Team, Insights, Reputation | M |
| D-03 | Inputs com `surface-card` | Tickets, ListingsToolbar, BulkModals, Drawers | M |
| D-04 | Stripe `colorPrimary: #7c3aed` hardcoded | checkout page | S |
| D-05 | Luxury residual em produto | ~74 files fora de `components/luxury/` | L |
| D-06 | Judge portal `text-white/*` | judge dashboard, ResolveCallModal | M |

### P1

| ID | Item | Contagem aprox. |
|----|------|----------------:|
| D-10 | `text-xs` vs tokens | ~624 |
| D-11 | `text-[Npx]` arbitrário | ~93 |
| D-12 | `shadow-lg`/`xl` em UI operacional | ~66 |
| D-13 | Paleta raw emerald/amber/red | ~200+ |
| D-14 | Empty state forks (5+) | 5 componentes |
| D-15 | Loading: pulse vs shimmer vs spinner | 3 padrões |
| D-16 | Dois DataTables | ui + seller-dashboard |
| D-17 | `seller-panel.css` dual theme path | 1 arquivo |
| D-18 | Half-step spacing (`py-3.5`) | ~37 |
| D-19 | Surface primitive quase não usado | 1 import |
| D-20 | Toast cores raw | Toast.tsx |

### P2

| ID | Item |
|----|------|
| D-30 | Lint ban `luxury-*` / `text-white` em CI |
| D-31 | Tipografia responsiva (clamp) |
| D-32 | Card rows mobile para ERP/Orders |
| D-33 | PDV bottom sheet |
| D-34 | Living styleguide / Storybook |
| D-35 | Densidade global no PanelShell |

---

## Dívida paga nesta sessão

- Empty/error/alert primitives theme-safe
- DataTable seller theme-safe + empty
- SaleStatusBadge → Badge DS
- Type scale expandida + mobile nav token
- Button loading polish
- TopBar Lucide
- KPI/overview white/ → muted
- Filtros black/20 → card
- WishlistButton / landing luxury hotspots
- Sticky bars unificadas
- CartDrawer touch + danger

---

## Regra de ouro para burn-down

1. **Primitives first** — um fix em `async-state` / `DataTable` / `Badge` multiplica.
2. **Ban na borda** — CI falha em `luxury-gold`, `text-white`, `bg-black/` em paths de produto.
3. **Um empty, um loading, uma table** — deletar forks.
4. **Densidade > decoração** — menos cards, mais hairlines (Stripe).
