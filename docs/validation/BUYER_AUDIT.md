# BUYER_AUDIT.md

**Personas:** Comprador novo · recorrente · PRO · guest converting  
**Flows audited:** Cadastro → Login → Marketplace → Search/Filter → PDP → Cart add/remove → Favoritos/Compare → Checkout → Pedido → Wallet/Cashback → History → Review  
**Cross-ref:** [BUG_REGISTRY.md](./BUG_REGISTRY.md)

## Journey verdict

Buyer funnel is **structurally broken for guests** at auth entrypoints and **trust-damaged** on cart/auth errors. Catalog depth is strong; money surfaces (`/comprador/financeiro`) look finished but are not checkout-backed.

## Flow findings

### Cadastro / Login
- Supabase `/entrar` is the real path — many CTAs still send to `/login` (BUY-001, BUY-014).
- `redirect=` vs `next=` mismatch (BUY-002); header Entrar loses pathname (BUY-011).
- Email confirmation framed as error; `next` not retained (BUY-006).

### Explorar / Search / Filter
- Faceted store search rich; header search failure silent (BUY-010).
- Analytics contract broken on facets (SEA-02); header search not tracked (SEA-01).

### PDP / Cart
- Listings without `store_product_id` still show buyable pricing (BUY-005).
- Cart 401 → empty cart UX (BUY-003); drawer missing outside store providers (BUY-004).

### Favoritar / Comparar
- Surfaces exist; compare analytics name dead (ANA-03). Coverage thinner than marketplace CTAs — treat as P2/P3 risk for drop mid-funnel.

### Checkout / Pedido
- Soft-fail empty cart states confuse unauth vs empty (BUY-012).
- Smart Cart goals add friction before pay (BUY-013).

### Wallet / Cashback / Histórico
- Dual ledger story (FIN-01); UI can show zeros without explaining `checkout_wired=false` (FIN-03, BUY-008 credentials).
- Cashback / store credit messaging not unified with order history — trust gap vs Stripe/ML.

### Avaliação
- Post-order review path not validated as primary conversion risk vs auth/cart P0s; flag for runtime QA in RC2 Gate Sprint.

## Conversion killers (ordered)

1. Wrong login route  
2. Lost redirect after auth  
3. Silent cart auth failure  
4. Fake-affordable listings without addable product id  
5. Wallet that looks real but isn’t connected to pay

## Recommendations (no impl this sprint)

See PRODUCT_BACKLOG P0/P1 buyer rows. Prioritize auth funnel before UI polish on buyer wallet.
