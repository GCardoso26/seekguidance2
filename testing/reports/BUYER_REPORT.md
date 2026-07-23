# BUYER_REPORT

**Persona:** Carlos (Buyer)  
**Gerado:** 2026-07-22T06:55:00Z  
**Status:** **FAIL** · Confidence **25%**

## Fluxo exigido vs evidência

| Passo | Resultado | Evidência |
|-------|-----------|-----------|
| Login | PARCIAL | Auth Checkout API register/login OK no Render |
| Busca | PASS | `/loja/busca?q=bolt` 200; catalog search 200 |
| Universal Card Page | FAIL/WARN | Renato PDP 500×404 — URL fixture inválida |
| Wishlist | WARN | `/wishlist` 200 (HTML); toggle autenticado não E2E |
| Favoritos | WARN | Estrutura Profile V2; sem E2E |
| Coleção | WARN | `/colecao` 200; invalidation pós-compra **não** vista |
| Deck Builder | WARN | `/decks` 200 |
| Marketplace | WARN | `/loja` 200 |
| Carrinho | WARN | `/carrinho` 200; BFF cart 401 sem auth |
| Frete | SKIP | Não exercitado nesta rodada |
| PIX | **FAIL** | Stripe: `pix` invalid / not activated |
| Webhook | WARN | Endpoint responde 400 em body vazio (vivo); evento pago real **não** |
| Pagamento card | PARCIAL | PI + clientSecret OK; confirm sem pay → `requires_action`; UI Elements **não** |
| Pedido | **FAIL** | Sem Order comprovado pós-pagamento real |
| Coleção atualizada | **FAIL** | Sem evidência |
| Perfil atualizado | **FAIL** | Sem evidência |
| Avaliação / recompra | **FAIL** | Não executado |

## Runner

`carlos-buyer-stub.mjs` → **blocked** (“Environment Audit não liberou QA funcional”)

## Checkout V2 (API Render)

- Card session: **PASS** até `clientSecret`
- Confirm ×10 simulateSuccess: **10× completed** (idempotência de status)
- Concurrency 2 buyers: **ambos failed** — padrão 1+1 **não** comprovado

## Veredito

**NÃO apto** para Beta sob critério Buyer E2E completo.
