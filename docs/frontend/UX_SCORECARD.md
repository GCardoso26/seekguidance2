# UX Scorecard — JudgeTCG Premium

**Data:** 2026-07-10  
**Meta:** 9.5 / 10  
**Atual (pós-P0):** **8.6 / 10**

---

## Scorecard por dimensão

| Dimensão | Antes | Agora | Meta | Status |
|----------|------:|------:|-----:|--------|
| Hierarquia visual | 7.0 | 8.0 | 9.5 | Em progresso |
| Densidade (Stripe/Linear) | 5.5 | 7.0 | 9.5 | Em progresso |
| Tipografia tokenizada | 4.0 | 7.5 | 9.5 | Em progresso |
| Contraste / tema | 4.5 | 8.0 | 9.5 | Em progresso |
| Consistência cross-app | 5.5 | 7.5 | 9.5 | Em progresso |
| Tabelas | 5.5 | 7.8 | 9.5 | Em progresso |
| Forms / focus | 5.0 | 6.5 | 9.5 | Em progresso |
| Empty / loading | 5.0 | 8.0 | 9.5 | Em progresso |
| Microinterações | 6.0 | 7.0 | 9.0 | Em progresso |
| Mobile chrome | 6.0 | 7.8 | 9.5 | Em progresso |
| Design System adoption | 4.0 | 7.0 | 9.5 | Em progresso |

---

## Scorecard por página / superfície

| Superfície | Antes | Agora | Próximo ganho |
|------------|------:|------:|---------------|
| Marketplace home | 5.0 | 6.5 | Hero único |
| Card detail | 6.5 | 7.5 | CTA hierarchy |
| Cart | 6.0 | 7.2 | Menos nesting |
| Checkout | 7.0 | 8.0 | Stripe token |
| Buyer dashboard | 6.0 | 7.0 | page-container |
| Wishlist | 5.5 | 7.0 | Purge luxury |
| Seller overview | 5.5 | 7.5 | Densidade |
| Listings/Orders | 5.5 | 7.8 | Sticky viewport |
| Finance | 4.5 | 5.5 | Chart + table DS |
| Tickets/Team | 5.0 | 6.0 | Input DS |
| Admin | 6.0 | 7.0 | Densidade |
| Judge | 4.5 | 5.0 | Theme-safe |

---

## Roadmap para 9.5

### Sprint A (1–2 dias) — fechar P0 restante
- Hero único loja
- Chrome seller sem triplicar headers
- Inputs → `Input` DS
- Stripe colorPrimary token
- Judge `text-white` purge

### Sprint B (3–5 dias) — P1 adoção
- Script migrate `text-xs` → tokens (hotspots)
- Ban CI luxury/text-white
- Unificar DataTable
- Toast + empty forks
- Finance/Tickets tables

### Sprint C (1 semana) — P2 polish
- Mobile card rows
- Densidade PanelShell
- Microinterações 150–250ms audit
- Styleguide vivo

---

## Critérios de aceite 9.5

- [ ] Zero `text-white` / `bg-black/` em superfícies light-first de produto
- [ ] Zero `luxury-*` fora de `components/luxury` e marketing legado
- [ ] Tipografia só via tokens (`text-h*`, `text-body*`, `text-caption`, `text-label`)
- [ ] Um Empty, um Loading, uma Table canônicos
- [ ] Sticky mobile usa `--mobile-nav-offset` em 100% das barras
- [ ] Painel seller densidade comparável a Shopify Admin (rows ~32–40px)
- [ ] Light e dark passam contraste WCAG AA em empty/error/table/badge

---

## Fontes da auditoria

- Explore DS: tokens, primitives, contagens hardcoded
- Explore buyer/marketplace
- Explore seller/admin/judge
- Aplicação P0 documentada em `UI_IMPROVEMENTS.md`
