# Inventory Domain

Estoque **isolado** de `seller_products` / listings.

```
Inventory → Reservation → Order → Checkout
```

## Tabelas

- `inventory.stock_units` — on_hand / reserved / available (generated)
- `inventory.reservations` — held → confirmed | released | expired
- `inventory.stock_movements` — ledger de movimentos

## Serviço

`services/api/src/inventory/InventoryService.ts`

- `upsertStock` — sincroniza quantidade
- `hold` — reserva (SELECT FOR UPDATE)
- `release` / `confirm` — libera ou consome

Emite `StockChanged`, `InventoryReserved`, `InventoryReleased` em `platform.domain_events`.

## API

`GET /runtime/judge/inventory/stock`

## Integração futura

Bridge: ao publicar listing no Catálogo Mestre, chamar `upsertStock` com `subject_type=product_variant`.
Reservation Engine do Order BC pode passar a usar `inventory.reservations` como fonte de verdade.
