# BUYER_E2E_REPORT

**Carlos** · **2026-07-22T02:58:00Z** · Confidence **~40%** · Meta ≥95% **NOT MET**

## Executado
| Fluxo | Resultado |
|-------|-----------|
| Auth register/login (API Checkout V2) | PASS |
| Cart + add listing + session + confirm (API) | PASS (simulate) |
| BFF prod cart (origin UP) | 401 PASS |

## Não executado / bloqueado
| Fluxo | Motivo |
|-------|--------|
| Login ciclo refresh/logout FE | Sem Carlos Playwright nesta rodada (BUG-0013 host) |
| Busca singles/selados/sleeves/deckbox | Não reexecutado |
| Favoritos listas/share | Não reexecutado |
| Carrinho multi-seller UI | Não |
| Cupom UI | Não |
| Frete UI Melhor Envio | Não |
| Stripe Elements / PIX UI | Não — BUG-0014 |
| Pedido histórico/cancelar/avaliar | Não |

**Bloqueio:** BUG-0013 + BUG-0014 → campanha **INTERROMPIDA** antes de buyer ≥95%.
