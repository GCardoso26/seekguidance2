# UI Audit — JudgeTCG Design System V2 → Premium SaaS

**Data:** 2026-07-10  
**Escopo:** Visual / UX polish only (sem features, APIs, regras de negócio)  
**Referências:** Stripe Dashboard, Linear, Vercel, Shopify Admin, Cardmarket, TCGPlayer, Mana Pool  

---

## Nota geral

| Momento | Nota |
|---------|------|
| Antes desta sprint de polish | **~8.0 / 10** (DS V2 shipped, adoção parcial) |
| Após P0 aplicados nesta sessão | **~8.6 / 10** |
| Meta | **9.5+ / 10** |

**Veredito:** a fundação de tokens é sólida (light-first, HSL semântico, elevation, type scale). A distância até 9.5 é **adoção e enforcement** — luxury residual, `text-white`/`bg-black` em painéis, tipografia ad hoc (`text-xs` ×624 vs `text-caption` ×37), e chrome triplo no seller.

---

## Nota por módulo

| Módulo | Antes | Depois (P0) | Gap para 9.5 |
|--------|------:|------------:|--------------|
| Design System / tokens | 7.5 | **8.4** | Type scale completa + ban luxury API |
| Primitivos (Button/Card/Badge/Empty) | 7.0 | **8.5** | Unificar Card/Surface |
| Marketplace home | 5.0 | **6.5** | Hero único, ritmo de seções |
| Catálogo / card detail | 6.5 | **7.5** | Sticky único, CTA hierarchy |
| Carrinho inteligente | 6.0 | **7.2** | Menos nesting de cards |
| Checkout | 7.0 | **8.0** | Stripe colorPrimary token |
| Buyer dashboard | 6.0 | **7.0** | Um padrão de card |
| Wishlist / coleção / deck shop | 5.5 | **7.0** | Purge luxury restante |
| MobileLayout / CartDrawer | 6.5 | **7.8** | Safe-area, densidades |
| PanelShell / sidebars | 7.0 | **7.8** | Badge Lock Lucide |
| Seller overview / KPIs | 5.5 | **7.5** | Densidade Stripe |
| Listings / Orders tables | 5.5 | **7.8** | Sticky viewport real |
| PDV | 6.0 | **6.5** | Cart mobile sheet |
| Financeiro | 4.5 | **5.5** | Chart tokens, table DS |
| Reputação | 6.5 | **7.0** | Skeleton loading |
| Tickets / Team | 5.0–5.5 | **6.0** | Input DS |
| Insights / AI | 6.0 | **7.0** | — |
| Admin | 6.0 | **7.0** | Densidade |
| Judge portal | 4.5 | **5.0** | Theme-safe massivo |

---

## Top 100 melhorias (priorizadas)

### P0 — Bloqueadores de percepção premium (1–25)

1. Remover `text-white` / `bg-black` / `border-white/*` dos **primitives** (async-state, EmptyState, DataTable seller) — **FEITO**
2. Empty/error theme-safe (danger/warning tokens) — **FEITO**
3. DataTable seller: hover `muted`, células `foreground`, empty dashed — **FEITO**
4. SaleStatusBadge → Badge variants semânticos — **FEITO**
5. Token `--mobile-nav-offset` + sticky bars unificadas — **FEITO**
6. Escala tipográfica expandida (h4, body-lg, label, hint) — **FEITO**
7. Button loading inline (sem layout absoluto frágil) — **FEITO**
8. TopBars: Lucide Menu/Search (sem emoji) — **FEITO**
9. KPI strip: `surface-card` + tokens (sem `bg-white/[0.04]`) — **FEITO**
10. Filtros marketplace: `bg-card` + `focus-ring` (sem `bg-black/20`) — **FEITO**
11. WishlistButton theme-aware — **FEITO**
12. Landing: `from-primary/5 to-background` (sem luxury-gold/onyx) — **FEITO**
13. CardBuyPanel: `shadow-card` + `rounded-xl` — **FEITO**
14. Checkout progress: `shortLabel` no mobile — **FEITO**
15. CartDrawer overlay/touch targets/danger — **FEITO**
16. Overview widgets: `bg-muted/40` em vez de `white/` — **FEITO**
17. Insights: border-border / primary (sem luxury-gold) — **FEITO**
18. Unificar sticky mobile cart + card detail — **FEITO**
19. Eliminar hero duplicado loja (MarketplaceFirstLanding + CatalogMarketplaceSection)
20. Inputs painel: parar `surface-card` como campo → `Input` DS
21. Remover chrome triplo (TopBar + SellerHeader + PageHeader) em Finance/Team/Insights
22. Stripe Elements `colorPrimary` via CSS var `--primary`
23. Purge `luxury-*` em wishlist/produtos tabs/judge hotspots
24. Status badges tickets/finance → Badge DS
25. Dark: garantir `--success-foreground` / `--warning-foreground` — **FEITO**

### P1 — Consistência e densidade (26–60)

26. Migrar `text-xs` → `text-caption` / `text-small` (hotspots: seller, judge, marketplace)
27. Banir `text-[Npx]` fora de PDV print
28. Unificar Card / Surface / `.surface-card` (um import path)
29. Deprecar API Tailwind `luxury.*` (aliases só em CSS interno)
30. Sticky thead com viewport (`max-h` + overflow) em Listings/Orders
31. Densidade configurável global (comfortable/compact) no PanelShell
32. Buy panel: 1 CTA primary + 1 outline
33. Carrinho: remover borda do line item dentro de Card
34. Buyer: `page-container` único; H1 com `text-h1`
35. Empty states: ícone + título + descrição + CTA em 100% das listas
36. Loading: PageSkeleton tipado (table/grid/page); spinner só em botões
37. Toast: tokens success/danger/warning (sem green-500 raw)
38. Tabs altura = control height (h-9)
39. Sidebar plan badge: Lock Lucide + `bg-muted`
40. Finance chart: strokes via `--border` / `--muted-foreground`
41. Team CTA: `text-primary-foreground` (não `text-black`)
42. JudgeEmptyState: tokens semânticos (não HSL light-only)
43. Judge dashboard: `text-muted-foreground` (não `text-white/60`)
44. Ofertas mobile: card stack em vez de tabela larga
45. Separadores CartDrawer entre itens
46. Safe-area padding em drawers mobile
47. Period filters: um radius (`rounded-md`) em todo painel
48. Section titles: só `.section-title`
49. Shadow: preferir `shadow-card` / `shadow-xs`; evitar `shadow-xl` em UI operacional
50. Focus: garantir `.focus-ring` em todos os controles custom
51. Hover tables: 150–200ms transition
52. Skeleton shimmer único (deprecar `animate-pulse` paralelo)
53. MultiSelectTCG / DatePicker: purge luxury
54. PricingCard: tokens brand (não luxury-gold + text-white)
55. GlobalSearchBar: tokens
56. PlanLimitBanner: tokens
57. EmptyTableState judge: sem luxury-gold focus
58. DisputeEmptyState: sem emoji
59. StoreHealthScoreWidget: Badge/semantic (não emerald raw)
60. Condition colors dark completos (MP/HP/DM)

### P2 — Polish final 9.5 (61–100)

61–70. Microinterações: press states, fade 200ms, success checkmarks sutis  
71–80. Mobile: card rows para ERP/Orders; PDV bottom sheet checkout  
81–85. Tipografia responsiva (clamp em display/h1)  
86–90. Remover half-steps (`py-3.5`)  
91–95. Lint/CI: ban classes `luxury-*`, `text-white`, `bg-black/` em `src/app` + `components` (exceto marketing)  
96–98. Documentar component standards com screenshots  
99. Storybook / canvas living styleguide  
100. Roadmap trimestral de debt burn-down  

---

## Problemas estruturais (resumo)

1. **Dois sistemas de tema** no painel (`seller-panel.css` luxury-panel vs tokens DS)
2. **Dois DataTables** (ui vs seller-dashboard) — seller agora alinhado; unificação total pendente
3. **5+ empty states** paralelos
4. **Luxury aliases** ainda na public API do Tailwind
5. **Densidade** abaixo de Stripe/Linear (card soup + padding triplo)

---

## Arquivos P0 tocados nesta sessão

Ver `UI_IMPROVEMENTS.md` e `MIGRATION_REPORT.md`.
