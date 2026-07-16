# Order Domain (Sprint 5+)

**Status:** Congelado antes da implementação — Sprint 5.1  
**Equivale a:** `MARKETPLACE_DOMAIN.md` / `IDENTITY_DOMAIN.md`, agora para o domínio **financeiro**.  
**Relaciona:** [`MARKETPLACE_DOMAIN.md`](./MARKETPLACE_DOMAIN.md) · [`SYSTEM_FLOW.md`](./SYSTEM_FLOW.md) · [ADR-004](./adr/ADR-004-outbox-mandatory.md) · [ADR-007](./adr/ADR-007-marketplace-domain-boundaries.md)

## Princípio central

**Marketplace vende. Order compra.**  
São bounded contexts distintos. Checkout **não** vive dentro do Marketplace.

```text
Search API
    ↓
Marketplace Offer (Listing)
    ↓
Cart                    ← intenção (ainda não é venda)
    ↓
CheckoutSession         ← tentativa
    ↓
InventoryReservation    ← estoque HELD (não muta Inventory ainda)
    ↓
Payment                 ← PaymentGateway (Fake → Stripe depois)
    ↓
Order                   ← raiz financeira
    ↓
Confirmation            ← reserva CONFIRMED · Order PAID/FULFILLED
```

## Bounded context

```text
order/
    domain/        Cart · CheckoutSession · Order · InventoryReservation + ports
    application/   AddToCart · StartCheckout · Reserve · Pay · CompleteOrder
    persistence/   InMemory (5.1) → Postgres order.* (5.2)
    api/           (Sprint 5.4)
```

Schemas PG (Sprint 5.2): `cart.*` · `order.*` · `reservation.*` — separados de `marketplace.*`.

## Agregados

### 1. Cart — intenção de compra (não é venda)

```text
Cart { id, buyerId, status, items[] }
CartItem { listingId, catalogVariantId, quantity, priceSnapshotCents, currency }
```

| Campo | Notas |
|-------|-------|
| `status` | `open` \| `checked_out` \| `abandoned` |
| `priceSnapshotCents` | congelado no item no momento do **add/checkout** — nunca reconsultar Listing depois |

### 2. CheckoutSession — tentativa de compra

```text
CheckoutSession { id, cartId, buyerId, status, orderId? }
```

Estados:

```text
CREATED → VALIDATING → RESERVED → PAYMENT_PENDING → COMPLETED
                                                 ↘ FAILED
```

### 3. Order — raiz financeira

```text
Order { id, buyerId, checkoutSessionId, status, totalAmountCents, currency, items[] }
OrderItem { listingId, catalogVariantId, quantity, unitPriceCents, currency }
```

Estados: `PENDING` → `PAID` → `FULFILLED` · ou `CANCELLED`.

Itens carregam **snapshot de preço**. `Order.total` nunca é recalculado a partir do Listing atual.

### 4. InventoryReservation — estoque HELD (não muta Inventory direto)

```text
InventoryReservation {
  id, listingId, inventoryItemId, quantity, buyerId,
  status, expiresAt
}
```

Estados: `HELD` → `CONFIRMED` · ou `RELEASED` · ou `EXPIRED`.

Por quê reserva e não débito imediato: pagamento recusado, timeout e cancelamento precisam liberar estoque sem inconsistência.

## Pagamento

Port: **`PaymentGateway`**. Adapter dia 1: **`FakePaymentProvider`** (`approved` \| `declined` \| `timeout`).

Pagamento **não conhece** Marketplace. Só:

```text
PaymentIntent { id, amountCents, currency, status, externalRef? }
```

Stripe real fica fora desta sprint (igual Scryfall: primeiro domínio, depois provider LIVE).

## Eventos (ADR-004 — só via Outbox)

```text
CartCreated
CartItemAdded
CheckoutStarted
ReservationHeld
ReservationRejected
ReservationConfirmed
ReservationReleased
ReservationExpired
PaymentRequested
PaymentApproved
PaymentDeclined
OrderCreated
OrderCompleted
```

Nada de chamada síncrona entre Marketplace e Order para “fechar venda”.

## Reservation Engine (Sprint 5.3)

```text
order/reservation/
  domain/        ReservationEngine · ReservationPolicy · ReservationResult
  application/   Hold · Confirm · Release · Expire
```

- Capacidade: `availableQuantity` (input) − `reservedQuantity` (HELD vigente + CONFIRMED).
- Concorrência PG: `pg_advisory_xact_lock(hashtext(inventory_item_id))`.
- Idempotência: `request_id` único.
- **Não** muta `marketplace.inventory` — só `reservation.*`.

## Regras invioláveis

1. **Listing não é pedido.** Order referencia `listingId`; nunca altera Listing.
2. **Preço é snapshot.** Nunca `Order.total = buscar Listing atual`.
3. **Pagamento não conhece Marketplace.** Só PaymentIntent.
4. **Estoque não depende do pagamento.** Fluxo: Reserva → Pagamento → Confirma reserva. Nunca: Pagar → tentar achar estoque.
5. **Marketplace ≠ Order.** Checkout fora de `marketplace/`.

## Persistência (Sprint 5.2)

Schemas separados: `cart.*` · `order.*` · `reservation.*`.  
**Sem FK** para `marketplace.*` / `catalog.*` / `identity.*` — referência por ID (ADR-007).  
Outbox compartilhado: `platform.outbox_events`.  
Composition: `createInMemoryOrderStack()` / `createPostgresOrderStack(pool)` / `createInMemoryCheckoutApiStack()`.  
Certificação: `npm run certify:order` · `npm run certify:checkout`.

## Checkout API (Sprint 5.4)

Contrato: [`CHECKOUT_API_CONTRACT.md`](./CHECKOUT_API_CONTRACT.md).  
Controller fino → AS. Pay: Reservation HELD → FakePayment → Order PAID/CANCELLED.

## Ordem de entrega

| Sprint | Entrega |
|--------|---------|
| **5.1** | Cart + Order domain · ports · InMemory · AS · testes — **sem API** |
| **5.2** | PG `cart.*` / `order.*` / `reservation.*` + Repository Contracts |
| **5.3** | Reservation Engine + TTL + race (estoque=1, A vs B) ✅ |
| **5.4** | Checkout API (`/cart`, `/checkout`, `/orders`) ✅ |
| **5.5** | Payment adapter + webhook simulation (Fake → Stripe depois) ✅ |

## Golden Path (evolução do smoke)

```text
Provider → Search → Seller Listing → Buyer Register
  → Cart → Checkout → Reservation → Payment → Order Complete
```

## Fora de escopo (bloqueado)

Stripe real · cupom · cashback · frete · multi-vendedor complexo · split · comissão · avaliação · disputa · refund avançado.
