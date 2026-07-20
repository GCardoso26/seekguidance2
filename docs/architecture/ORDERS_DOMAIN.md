# Orders BC

**Status:** In progress (após Checkout Done)  
**Roadmap:** Orders → **Projections** → Notifications → Analytics  
**Public API:** `services/api/src/orders/public.ts`

## Escopo

Aggregate mínimo: `Order` + `OrderItem` + timeline append-only + status.  
**Sem** lógica de envio (Fulfillment consome `OrderPaid` depois).

## Status

`PENDING` → `PAID` → `PROCESSING` → `SHIPPED` → `DELIVERED`  
paralelos: `CANCELLED` | `REFUNDED`

## Eventos (.v1)

`OrderCreated`, `OrderPaid`, `OrderProcessing`, `OrderShipped`, `OrderDelivered`,  
`OrderCancelled`, `OrderRefundRequested`, `OrderRefunded`

## Projeções (nunca listar pelo Aggregate)

- `SellerOrdersProjection`
- `BuyerOrdersProjection`
- `DashboardProjection`
- `RecentOrdersProjection`

## Handoff do Checkout

Consome `CheckoutCompleted.v1` via public handoff DTO (`checkout/public`).  
Não faz SQL em `checkout.*`.

## Próximos

Notifications e Analytics **só eventos**. Identity e Fulfillment depois.
