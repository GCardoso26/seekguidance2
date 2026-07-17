# Sprint 7 — Definition of Done (fechado)

**Status:** ✅ Entregue  
**App:** `apps/web` · fatias 7.1–7.4

## Fluxo vertical

```text
CATALOG          BUYER                         SELLER
Scryfall           Busca                         Conta
  ↓                ↓                             ↓
Catalog            PDP Catalog                   Loja
  ↓                ↓                             ↓
Search             Ofertas Marketplace           Seleciona carta
                   ↓                             ↓
                   Carrinho                      Inventory → Listing
                   ↓                             ↓
                   CheckoutSession CREATED       Oferta visível ao buyer
```

## Critérios

| Área | Resultado |
|------|-----------|
| Seller | Conta · loja · publicar · oferta disponível |
| Buyer | Busca · Catalog · Offers · cart · checkout start |
| Técnico | Só APIs existentes · sem BFF · Catalog ≠ Marketplace · JWT/RBAC |
| Produto | Pessoa A vende carta · Pessoa B compra — caminho técnico existe (beachhead Release 1: Lorcana) |

## Docs por fatia

- [7.1 Fundação](../../apps/web/docs/SPRINT_7_1.md)
- [7.2 Buyer Search/PDP](../../apps/web/docs/SPRINT_7_2.md)
- [7.3 Seller Portal](../../apps/web/docs/SPRINT_7_3.md)
- [7.4 Cart/Checkout](../../apps/web/docs/SPRINT_7_4.md)

## O que não está nesta entrega

Pagamento real · comissão · beta operacional · hardening produção (SECURITY-001, etc.)

## Próximo

[`SPRINT_8_PLAN.md`](./SPRINT_8_PLAN.md) — beta fechado com lojas (operação &gt; código).
