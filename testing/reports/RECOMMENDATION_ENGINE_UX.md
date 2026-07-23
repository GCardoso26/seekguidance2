# RECOMMENDATION_ENGINE — UX / Buyer / Search / Integration / Performance

**Date:** 2026-07-22

## UX
Painéis curtos (“Você possui X% do deck”) — não telas de IA.

## Buyer (Carlos)
Faltantes → shopping do deck; recomendações buyer na home live.

## Integration
`/api/user/collection/insights`, `/api/buyer/decks/{id}/shop`, `/api/buyer/recommendations`, price-history, events.

## Performance
Queries stale 60s; painéis client-only sem bloquear LCP do hero.
