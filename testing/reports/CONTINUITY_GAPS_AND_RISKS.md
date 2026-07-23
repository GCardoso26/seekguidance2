# CONTINUITY — Gaps & Risks

**Date:** 2026-07-22

## Gaps

| Gap | Risco | Plano |
|-----|-------|-------|
| OrderPaid não projeta Collection no BE | Dados de coleção atrasam até ingest/fulfillment | Roadmap: projection via Outbox sem cross-schema; FE já refetch |
| Feed social não gera item automático de compra | Atividade incompleta | Estender projection social existente (sem novo BC) |
| Personas 8h não executadas nesta sessão | Sem confidence ≥95% | Campanha final operacional |
| Lighthouse pós-deploy | Meta CWV | `npm run lighthouse:prod` após deploy |
| Keys ainda duplicadas em alguns call sites (`["shop-cart"]`) | Fragilidade | Migrar gradualmente para `query-keys/player` |

## Cobertura (FCS estimado desta fatia)

- Invalidate pós-compra: **alto**
- CTAs contínuos: **alto**
- Wishlist na UCP: **alto**
- Projeção BE coleção pós-order: **baixo** (gap documentado)
- E2E jornada completa: **médio** (precisa Playwright dedicado)

## Plano de correção antes do beta

1. E2E Playwright: Card → Wishlist → Checkout → Coleção → Deck → Perfil  
2. Campanha 8h personas  
3. Projection OrderPaid → collection (RFC se tocar boundaries)  
4. Lighthouse gate no CI pós-deploy  
