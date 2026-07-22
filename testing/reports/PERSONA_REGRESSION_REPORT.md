# Persona Regression Report — campaign-012

**Orquestrador:** `npm run test:qa:orchestrator`  
**Log:** `testing/reports/_bugfix_orchestrator.log`  
**Consolidado:** `testing/reports/qa-campaign-consolidated.json`  
**Histórico:** `testing/history/campaign-012.json`

## Resultados

| Persona | Status | Confidence | Notas vs brief |
| --- | --- | --- | --- |
| Marina | pass | 78% | lifecycle + **PDV Playwright 5/5** (suite separada). Stripe/PIX/financeiro live: parcial / NÃO COMPROVADO |
| Carlos | pass | 72% | busca/marketplace/cart/checkout-page/histórico. PSP real / perfil profundo: NÃO COMPROVADO |
| Fernanda | pending_manual | 45% | 3 lojas / liquidez: **NÃO COMPROVADO** |
| Juliana | partial | 62% | structure PASS; UX mobile/desktop supervisionado: parcial (PDV mobile E2E PASS) |
| Eduardo | pass | 98% | search score 85. SKU/pedidos/clientes painel: NÃO COMPROVADO |
| Daniela | pass | 65% | providers unit PASS. Importação/Asset E2E: NÃO COMPROVADO |
| Renato | pass | 98% | **PDP 25/25 OK** (fix P2). CWV/Lighthouse/memória painel: NÃO COMPROVADO |

## Regressões de persona

Nenhuma persona automatizada regrediu de pass → fail nesta execução.

Fernanda permanece `pending_manual` (pré-existente).

## Extra (fora do orchestrator stub)

- Playwright PDV: PASS  
- Vitest PDV: PASS  
- Gates/smoke: PASS
