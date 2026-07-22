# COLLECTION_V2_BUYER_REPORT

**Persona:** Carlos (Buyer)  
**Gerado:** 2026-07-22  

## Fluxo esperado

Entrar → `/colecao` → ver valor/progresso → `/colecao/cartas` adicionar → wishlist → preço caiu (scaffold alertas) → marketplace → checkout → coleção atualizada.

## Smoke / código

| Passo | Status |
|-------|--------|
| Entrar `/colecao` | Página + login gate |
| Dashboard insights | BFF `/api/user/collection/insights` |
| Adicionar carta | Modal + Collection API (existente) |
| Wishlist | `/colecao/wishlist` reusa Wishlist API |
| Preço caiu | Slot em `/colecao/alertas` (estrutura; sem push) |
| Comprar faltantes | Link Marketplace search por set |
| Checkout | Fluxo marketplace pré-existente |
| Coleção atualizada | Invalidation `user-collection` + insights |

## Veredito Carlos

**APROVADO com ressalvas:** alertas de preço da coleção ainda não disparam notificações (só scaffold). Checkout E2E depende de auth + estoque live.
