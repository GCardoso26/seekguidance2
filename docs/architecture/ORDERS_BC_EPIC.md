# Orders BC — Épico

**Status:** In progress  
**Pré-requisito:** Checkout BC **Done** ([CHECKOUT_BC_EPIC.md](./CHECKOUT_BC_EPIC.md))  
**Roadmap de produto:**

```text
Orders → Projections → Notifications → Analytics
         (Identity e Fulfillment depois)
```

## Por que Projections antes de Notifications

Já existem Domain Events, Projection Worker, CQRS e MVs.  
Orders nasce publicando eventos; projeções escutam; Notification/Analytics reutilizam os **mesmos** eventos.

## Aggregate

`Order` { id, buyer, seller, status, payment_status, checkout_session, created_at }  
`OrderItem` { order_id, product_variant, listing, quantity, unit_price, total }  
`Timeline` append-only (nunca UPDATE de registros antigos)

## DoD (épico)

- [ ] Create Order a partir de `CheckoutCompleted` (public handoff)
- [ ] Timeline + status machine mínima
- [ ] Eventos `.v1` registrados + Outbox
- [ ] 4 projeções alimentadas
- [ ] Listagens HTTP só via projeções
- [ ] `PUBLIC_API_BOUNDARIES.md` atualizado
- [ ] Architecture tests verdes

## Fora de escopo

Fulfillment, labels, Notification adapters, Analytics marts avançados.
