# Payment Provider Contract — Fake → Stripe (futuro)

**Status:** Congelado — Sprint 5.5  
**Versão de API:** `/api/v1/`  
**Relaciona:** [`ORDER_DOMAIN.md`](./ORDER_DOMAIN.md) · [`CHECKOUT_API_CONTRACT.md`](./CHECKOUT_API_CONTRACT.md)

## Princípio central

**Payment não conhece Marketplace.**  
Só conhece `PaymentIntent` / aggregate `Payment`.

```text
Order Domain
      │
      ▼
Payment Application Service
      │
      ▼
PaymentGateway (port)
      │
      ├── FakePaymentProvider   ← Sprint 5.5
      └── Stripe (futuro)       ← bloqueado nesta sprint
```

**Proibido no Payment BC:**

```text
Listing · Seller · Inventory · Catalog · Search · Cart
```

## Aggregate `Payment`

```text
Payment {
  id, orderId, amountCents, currency,
  status, provider, externalReference,
  requestId, reservationIds[], rowVersion
}
```

Estados:

```text
CREATED → REQUESTED → AUTHORIZED
                    ↘ FAILED
                    ↘ CANCELLED
```

Estados terminais são imutáveis (webhook duplicado / fora de ordem = no-op consistente).

## Port `PaymentGateway`

```ts
interface PaymentGateway {
  createPayment(intent: PaymentIntent): Promise<PaymentResult>
  queryPayment(externalReference: string): Promise<PaymentProviderStatus>
}
```

Checkout **nunca** chama Fake/Stripe/Webhook diretamente — só `RequestPaymentApplicationService`.

## Fluxo assíncrono

```text
PayCheckout
  → Hold reservations
  → RequestPayment (Payment REQUESTED + Outbox PaymentRequested)
  → CheckoutSession PAYMENT_PENDING
  → (cliente / simulator) POST /api/v1/payments/webhook
  → ApplyPaymentWebhook
  → SettlePayment (Order PAID | CANCELLED + Confirm/Release)
```

## Webhook simulation

```text
POST /api/v1/payments/webhook
```

```json
{
  "provider": "fake",
  "event": "payment.approved",
  "paymentId": "...",
  "idempotencyKey": "..."
}
```

Validar: provider conhecido · evento válido · assinatura fake · idempotency key.

Header: `X-Payment-Signature: fake:<paymentId>`

## Eventos (só Outbox)

```text
PaymentRequested
PaymentApproved
PaymentDeclined
PaymentFailed
PaymentCancelled
```

## Persistência

Schemas: `payment.payments` · `payment.payment_events`  
`orderId` é referência de domínio — **sem FK** para `order.*` / marketplace / catalog.

## Fora de escopo

Stripe real · Mercado Pago · PIX · cartão · antifraude · chargeback · refund avançado · split · comissão.
