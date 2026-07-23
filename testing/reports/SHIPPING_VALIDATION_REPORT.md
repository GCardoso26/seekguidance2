# SHIPPING_VALIDATION_REPORT

**Gerado:** 2026-07-22T02:56:00Z  
**Verdict:** PASS (harness Melhor Envio live)  
**Confidence Shipping:** ~80% (cotação API; frete no UI checkout **não** revalidado)

## Melhor Envio
| Case | Status | Detail |
|------|--------|--------|
| quote production | PASS | n=14 · Correios PAC 2477c · prazo 5–7d |
| mudança CEP | PASS | n=14 |
| modalidades | PASS | PAC / SEDEX / Jadlog |
| SLA/valor | PASS | ok=14 |
| Stub quote/CEP/modality/SLA | PASS | matrix stub |

## Não cobertos
- Troca de modalidade no UI checkout FE
- Fallback UX quando ME indisponível (chaos gateway shipping)
- Frete multi-vendedor no carrinho FE

## Artefato
`validate-payment-shipping.mjs` live/me_* PASS
