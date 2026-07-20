# Checkout BC — Épico

**Status:** In progress — Sprint 1 (capacidades de domínio)  
**Prioridade:** 🔴 Muito alta  
**Disciplina (ADR-015):** Arquitetura em **modo manutenção** — só evolui via RFC + ADR.  
Desenvolvimento foca em **funcionalidades de negócio**. Métrica de sucesso = valor ao usuário, não novos componentes transversais.

## Objetivo

Fluxo completo via **interfaces públicas**, **Saga**, **Outbox**, **sem SQL cross-schema**:

```text
Carrinho → Validação → Reserva → Precificação → Cupom
  → Payment Intent → Pagamento confirmado → OrderCreated
  → InventoryConfirm → Notification* → Analytics*
```

\* Notification e Analytics **consomem eventos** — nenhum BC chama Notification diretamente; Analytics nunca faz `SELECT checkout.sessions`.

## Domínio

Ver [CHECKOUT_DOMAIN.md](./CHECKOUT_DOMAIN.md).

## Consumidores permitidos (somente Public API)

```text
ListingPublicQuery / marketplace/public
PricingService     / pricing/public
InventoryService   / inventory/public  (hold | confirm | release)
SagaOrchestrator
FeatureFlagService (checkout_v2)
DomainEventFactory + Outbox
```

## Proibido

```sql
SELECT * FROM marketplace.listings;
UPDATE inventory.stock_units …;
SELECT * FROM pricing.…;
```

Importar `*/persistence/*` de outro BC.

---

## Sprint 1 — Capacidades naturais do Checkout

### Cart Engine (Aggregate)

| Comando | Notas |
|---------|--------|
| `AddItem` | Aggregate mutates + snapshot |
| `RemoveItem` | |
| `UpdateQuantity` | qty ≤ 0 → remove |
| `MergeGuestCart` | guest → user open cart |
| `MergeUserCart` | fonte → destino (mesmo buyer ou pós-login) |
| `ValidateItems` | listing ativo, qty, snapshot coerente |

### Coupon Engine (Rules)

| Rule | |
|------|--|
| Fixed / Percentage / FreeShipping | |
| MinimumValue / MaximumUses / Expiration | |
| SellerCoupon / MarketplaceCoupon | |
| GameRestriction / CategoryRestriction | |

### Payment Intent — Adapter Pattern

```text
PaymentGateway → Stripe | MercadoPago | PagSeguro | Pagar.me | Asaas
```

Nunca código de gateway específico no núcleo do Checkout.

### Checkout Validation Pipeline

```text
ValidateSeller → ValidateInventory → ValidateCoupon
  → ValidatePrices → ValidatePayment → CreateSession
```

Cada validator independente.

---

## Saga (StartCheckout)

```text
ValidateCart → HoldInventory → RefreshPricing → ApplyCoupon
  → CreatePaymentIntent → PersistCheckoutSession → Emit CheckoutStarted
```

## Saga (ConfirmPayment)

```text
ValidateSession → ConfirmGatewayPayment → InventoryConfirm → MarkSessionCompleted
  → Outbox: PaymentApproved + InventoryConfirmed + OrderCreated + CheckoutCompleted
```

Pagamento recusado → `InventoryService.release` + sessão `failed`.

O épico fecha quando o fluxo ponta a ponta abaixo funciona **só** com APIs públicas + Saga + Outbox:

1. Carrinho  
2. Validação (pipeline)  
3. Reserva de estoque  
4. Precificação  
5. Cupom (rules)  
6. Payment Intent (gateway adapter)  
7. Pagamento confirmado  
8. `OrderCreated` (handoff Orders BC quando existir; até lá evento + sessão)  
9. `InventoryConfirm`  
10. Eventos prontos para Notification / Analytics (sem acoplamento)

## Métricas de produto (não de arquitetura)

| Funil | Eventos |
|-------|---------|
| Checkout | Started → Completed → conversão |
| Carrinho | Created → Abandoned → recovery |
| Reserva | Hold → Released / Expired / Confirmed |
| Pagamento | Intent Created → Succeeded / Failed / Timeout |
| Marketplace | Listing Viewed → Added to Cart → Purchased |

---

## Próximos BCs (após Checkout estabilizar)

| Ordem | BC | Notas |
|-------|-----|--------|
| 1 | **Orders** | Aggregate simples: Order → Items → Timeline → Status → Payment → Shipment **reference**. Sem lógica de envio. Eventos: `OrderCreated/Paid/Cancelled/Refunded.v1` |
| 2 | **Notification** | Só eventos → Email / Discord / Push / Webhook |
| 3 | **Analytics** | Projections a partir de eventos — nunca SQL em `checkout.*` |
| 4 | **Fulfillment** | Shipment / Carrier / Tracking / Label / Delivered — **separado** |

## Fora de escopo neste épico

- Fulfillment / labels  
- Event Store completo / mesh novo  
- Motor fiscal completo  
- Multi-moeda avançada  
