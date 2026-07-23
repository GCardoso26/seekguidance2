# PLAYER_JOURNEY_CONTINUITY — Acceptance

**Date:** 2026-07-22  
**Mission:** Experiência contínua (sem novos módulos)

## Verdict

**PASS (glue FE)** — Invalidação compartilhada pós-compra/coleção/venda + CTAs de continuidade + wishlist real na Card Page + contexto de jogo preservado. Sem novo BC. Domain sync permanece Outbox → Projection.

## Wired cascade

```
Checkout success / PIX paid
  → invalidateAfterPurchase
  → cart, orders, buyer, collection, decks, wishlist,
    intel/recs, gamification, notifications, feed, live, profile
  → awardXpFireAndForget(..., qc)
  → ContinuityNextSteps (coleção / decks / perfil / alertas)
```

## Criteria

| Item | Status |
|------|--------|
| Nenhum novo BC | ✅ |
| Só APIs públicas / composição FE | ✅ |
| Feature flag `PLAYER_JOURNEY_CONTINUITY` | ✅ |
| Pós-checkout sem refresh manual | ✅ invalidate |
| Collection mutate → decks/missing/intel | ✅ |
| Seller sale → ops + XP | ✅ |
| Card wishlist toggle (não só link) | ✅ |
| Journey context (game slug) | ✅ sessionStorage |
| Notification deep links ampliados | ✅ |
| ADR-011 / ADR-015 | ✅ |

## Gaps restantes (não bloqueiam glue; documentar no Freeze)

1. Backend `OrderPaid.v1` ainda não projeta coleção do comprador automaticamente — FE refetch cobre UX; projeção real exige épico de fulfillment→collection via Outbox (roadmap).
2. Lighthouse / campanha 8h / personas ≥95% — evidências operacionais pendentes.
3. Checkout gateways reais — validação controlada pendente.
