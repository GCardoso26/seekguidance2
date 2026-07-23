# PDV — Persona Carlos (Comprador)

**Persona:** Carlos Henrique — Buyer QA  
**Fonte:** `persona-carlos-buyer-latest.json` (2026-07-22T21:13:42Z)

## Veredito Carlos

Fluxo comprador **parcialmente comprovado** (lifecycle 9/9). Integração completa com PSP real e avaliação: **Não comprovado**.

## Fluxo pedido

| Etapa | Status | Evidência |
| --- | --- | --- |
| Buscar | PASS | `coveredFlows`: search |
| Marketplace | PASS | marketplace |
| Wishlist | PASS | wishlist |
| Adicionar ao carrinho | PASS | cart |
| Checkout (página) | PASS | checkout-page |
| PIX real / cartão real | **Não comprovado** | `coverageNote`: sem pagamento PSP real sem simulate |
| Pedido criado (pós-pagamento real) | **Não comprovado** | — |
| Perfil | **Não comprovado** (além do coberto pelo lifecycle) | — |
| Histórico de pedidos | PASS | orders-history |
| Avaliação | **Não comprovado** | coverageNote |

## Integração com operação do lojista

Checkout → Pedido → Estoque → Financeiro (ponta a ponta com Marina/PDV):

**Não comprovado** nesta campanha.

## Bugs

Nenhum P0–P3 novo registrado no JSON da persona Carlos nesta execução.

## Melhorias sugeridas (Carlos)

1. Gate E2E com PIX simulate + assert de pedido no painel do vendedor.
2. Cobrir recuperação de senha e avaliação no buyer lifecycle.
3. Evidência de recompra.

## Conclusão

Carlos valida navegação crítica do buyer em teste automatizado. Compra real fechada e impacto no estoque/financeiro do lojista: **Não comprovado**.
