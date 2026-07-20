# Checkout BC V2

**Status:** ✅ Done — handoff para [Orders](./ORDERS_DOMAIN.md)  
**Épico:** [CHECKOUT_BC_EPIC.md](./CHECKOUT_BC_EPIC.md)  
**Public API:** `services/api/src/checkout/public.ts`

## Responsabilidade (fechada)

Transformar carrinho válido → sessão concluída/falha (reserva, preço, cupom, PaymentIntent → **Payment**).  
Depois de `CheckoutCompleted.v1` + handoff `OrderCreated.v1`, **Orders** assume.

## PaymentIntent vs Payment

| Conceito | Significado |
|----------|-------------|
| PaymentIntent | Quero pagar (pendente no gateway) |
| Payment | Gateway confirmou (captured / authorized / …) |

## Capacidades

Cart Aggregate · Coupon Rules · Validation pipeline · ConfirmPayment saga · Handoff query
