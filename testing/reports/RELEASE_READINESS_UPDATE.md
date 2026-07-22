# Release Readiness Update — Stabilization PDV Bugs

**Data:** 2026-07-22  
**Campanha orquestrador:** campaign-012  
**Overall orquestrador:** ainda **NOT READY** (Fernanda manual, UX partial, confidence seller/buyer < 95%)

## Critérios do Stabilization Sprint

| Critério | Status |
| --- | --- |
| Checkout funcionando (código + unit) | Parcial — **live auth NÃO COMPROVADO** |
| Stripe Connect funcionando | Código + unit PASS; refresh unauth 401; **live NÃO COMPROVADO** |
| PIX funcionando | Código alinhado; vitest/playwright parcial; **live NÃO COMPROVADO** |
| Loja correta multi-loja | Código alinhado; **E2E multi-loja NÃO COMPROVADO** |
| PDV E2E Playwright verde | **PASS 5/5** |
| PDP sem 404 (Renato) | **PASS 25/25** |
| Nenhum novo P0/P1 | **PASS** (nenhum aberto nesta sprint) |
| Personas executando | Automáticas OK; Fernanda manual |

## Decisão

**Stabilization dos 3 bugs:** P1 e P2 **DONE com evidência**. P0 **DONE em código**, validação produção autenticada **pendente**.

**Não declarar sistema “corrigido / READY para mercado”** sem:

1. Sessão lojista: refresh Connect → checkout cartão 2xx  
2. PIX save na loja ativa correta  
3. (Opcional) assert estoque pós-venda PDV

## Referência

Orquestrador: `testing/reports/release-readiness.md` (NOT READY)  
Pacote: `PDV_BUGFIX_EVIDENCE.json`
