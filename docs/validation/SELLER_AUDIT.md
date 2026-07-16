# SELLER_AUDIT.md

**Personas:** Lojista · Dono · Gerente · Staff  
**Flows:** Criar loja → Dashboard → Config → Produtos → CSV → Edit → Analytics → Top Movers → Financeiro → Wallet → Eventos → Ingressos → Repasse → Logout

## Journey verdict

Seller ops **surface is mature** (products, CSV, analytics, events shells). **Permissions and plan truth** are unreliable under sandbox elevation; finance has **two parallel UIs** (live PIX vs platform shell). Discovery after header “Comprar” removal leaves Vender as primary commerce CTA — good for acquisition, but guest menu inconsistently gates seller entry (SEL-003).

## Flow findings

| Step | Finding | IDs |
|------|---------|-----|
| Criar loja | Weak guest auth UX on `/stores/create` | SEL-004 |
| Dashboard | Rich; feature locks uneven (cupons open then forbidden) | SEL-005 |
| Produtos / CSV / Edit | Core present; legacy forms can still hit `/login` | SEL-007 |
| Analytics / Top Movers | UI exists; compare event never fired | ANA-03 |
| Financeiro | Dual: PIX ops vs `/financeiro-platform` demo | FIN-02 |
| Wallet | Same dual-truth as buyer FIN-01 | FIN-01 |
| Eventos / Ingressos | Empty states weak; create soft-open server risk | SEL-006, RBAC-001 |
| Plan gates | Sandbox elevates features client-side even if backend differs | SEL-001, SEL-002, ADM-003 |
| Logout | Standard — no P0 noted |

## RBAC notes for seller roles

- Manager/staff event abilities undermined by `_require_organizer` on RC1 flow (RBAC-002).
- Cross-store dashboard query by `store_id` lacks membership check (SEC-004).

## Recommendations

1. Fail-closed sandbox/plan elevation on FE.  
2. Hard-403 create_event; wire PermissionService for staff event ops.  
3. Label “Financeiro (demo platform)” vs “Financeiro (PIX live)”.  
4. Auth-gate store create with `/entrar?next=`.
