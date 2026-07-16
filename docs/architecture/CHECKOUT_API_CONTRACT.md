# Checkout API Contract — Authenticated Buyer API

**Status:** Congelado — Sprint 5.4  
**Versão de API:** `/api/v1/`  
**Relaciona:** [`ORDER_DOMAIN.md`](./ORDER_DOMAIN.md) · [`IDENTITY_DOMAIN.md`](./IDENTITY_DOMAIN.md) · [`MARKETPLACE_DOMAIN.md`](./MARKETPLACE_DOMAIN.md)

## Três princípios

1. **Controller é fino** — só JWT, validação de input e DTOs. Sem SQL, sem regra financeira.
2. **Reservation antes de Payment** — nunca pagar e depois caçar estoque.
3. **Order não muta Marketplace** — Listing/Inventory só são lidos para snapshot e capacidade.

## Cadeia obrigatória

```text
Buyer (JWT)
  → POST/GET /api/v1/cart|checkout|orders
  → RequireAuth + RequireBuyer
  → Application Service
  → Domain / Repository
  → Outbox (eventos)
```

**Proibido:**

```text
Controller → SQL
Controller → regra financeira / lock de estoque
Controller → mutar marketplace.inventory | marketplace.listings
?buyerId=  (filtro do cliente)
```

## Autenticação

```text
Authorization: Bearer <access JWT>
```

- Role **buyer** obrigatória (`RequireBuyer`).
- Seller não ganha privilégios extras no checkout.
- Pedidos filtrados sempre por `currentUser.userId`.

## Endpoints

| Método | Path | AS |
|--------|------|-----|
| `POST` | `/api/v1/cart` | CreateCart |
| `GET` | `/api/v1/cart/:id` | CartRepository.findById |
| `POST` | `/api/v1/cart/:id/items` | AddCartItem (snapshot do Listing no edge) |
| `DELETE` | `/api/v1/cart/:id/items/:itemId` | RemoveCartItem |
| `POST` | `/api/v1/checkout` | StartCheckout |
| `POST` | `/api/v1/checkout/:id/pay` | PayCheckout (Hold → Pay → Confirm/Release) |
| `GET` | `/api/v1/orders` | OrderRepository.listByBuyer |
| `GET` | `/api/v1/orders/:id` | OrderRepository.findById + ownership |

### Cart — add item

Request:

```json
{ "listingId": "...", "quantity": 1 }
```

Edge resolve Listing **uma vez** → `priceSnapshotCents` + `catalogVariantId`.  
Depois disso o preço **não** é reconsultado.

### Checkout — start

```json
{ "cartId": "..." }
```

Resposta:

```json
{ "checkoutSessionId": "...", "status": "CREATED", "orderId": "..." }
```

Não paga. Cria Order PENDING com snapshots do cart.

### Checkout — pay

Ordem obrigatória:

```text
CheckoutSession CREATED
  → Reservation HELD (por item)
  → PaymentGateway (Fake)
  → Order PAID | CANCELLED
  → Reservation CONFIRMED | RELEASED
```

## DTOs públicos (nunca entidades internas)

- `CartResponse` / `CartItemResponse`
- `CheckoutResponse`
- `OrderSummaryResponse` / `OrderDetailsResponse`

Proibido serializar: `Cart` aggregate, `Order` aggregate, `InventoryReservation`, `PaymentIntent`.

## Eventos (somente Outbox)

```text
CartCreated · CartItemAdded · CheckoutStarted · OrderCreated
ReservationHeld · ReservationReleased · ReservationConfirmed
PaymentRequested · PaymentApproved | PaymentDeclined
OrderCompleted
```

## Performance budget

| Operação | Budget |
|----------|--------|
| Criar cart | &lt;100ms |
| Add item | &lt;150ms |
| Checkout start | &lt;200ms |
| Pay (fake) | &lt;500ms |
| GET order | &lt;100ms |

## Fora de escopo (bloqueado)

Stripe real · webhook · frete · cupom · cashback · comissão · split · frontend · multi-seller complexo.
