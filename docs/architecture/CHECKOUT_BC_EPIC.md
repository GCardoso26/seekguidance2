# Checkout BC — Épico

**Status:** ✅ **Done** (handoff → Orders)  
**Disciplina (ADR-015):** Arquitetura em modo manutenção.

## Critério de encerramento (oficial)

> O Checkout BC é responsável exclusivamente por transformar um carrinho válido em uma sessão de checkout **concluída ou falha**, coordenando reserva de estoque, validação de preços, aplicação de cupons e confirmação de pagamento.  
> Após a emissão de `CheckoutCompleted.v1` e `OrderCreated.v1` (handoff), **toda responsabilidade passa ao Orders BC**.

## Conceitos Payment

```text
PaymentIntent  →  "quero pagar" (gateway)
Payment        →  "o gateway confirmou" (fato financeiro)
```

PIX / cartão / boleto / reprocessamento / chargeback sem misturar Intent e Payment.

## Domínio

Ver [CHECKOUT_DOMAIN.md](./CHECKOUT_DOMAIN.md).

## Public consumers

`ListingPublicQuery`, `PricingService`, `InventoryService`, `SagaOrchestrator`,  
`FeatureFlagService(checkout_v2)`, `DomainEventFactory` + Outbox.

## Próximo

[ORDERS_BC_EPIC.md](./ORDERS_BC_EPIC.md) — roadmap: **Orders → Projections → Notifications → Analytics**.
