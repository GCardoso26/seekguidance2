# Saga / Process Manager

Componente estrutural para coordenar BCs sem acoplamento direto.

## Por quê

Com Catalog, Pricing, Inventory e Marketplace desacoplados, fluxos multi-etapa
(publicar anúncio, checkout, reembolso) precisam de **orquestração com retry e compensação**.

## Modelo

```
platform.sagas
  id, saga_type, correlation_id, status, context, error

platform.saga_steps
  saga_id, step_name, step_order, status, attempts, input, output, error
```

Status do saga: `running` → `completed` | `failed` (via `compensating` → `compensated`).

## API TypeScript

```ts
const orch = createSagaOrchestrator(pool);
await orch.run(definition, initialContext, { correlationId, requestId });
```

Cada step: `execute` + opcional `compensate` + `optional` + `maxAttempts`.

## Primeiro fluxo

`PublishProductListing` — ver [MARKETPLACE_ORCHESTRATOR.md](./MARKETPLACE_ORCHESTRATOR.md)

## Futuros

- `CheckoutReservationSaga`
- `OrderRefundSaga`
- `PriceAlertDispatchSaga`
