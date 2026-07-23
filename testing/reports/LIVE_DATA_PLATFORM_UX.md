# LIVE_DATA_PLATFORM — UX / Buyer / Search / Integration / Performance

**Date:** 2026-07-22

## UX (Juliana)
Plataforma parece viva: home muda com decks, movers, eventos e recomendações; portais têm meta/staples/eventos próprios.

## Buyer (Carlos)
Em <15s na Home vê novidades (decks, preço caiu/subiu, eventos) e caminhos para compra.

## Search / SEO
Rotas existentes + Tournament Hub `/torneio` com metadata; cards mantêm price-history ranges.

## Integration
Somente BFFs: `/api/decks/public`, `/api/runtime/top-movers`, `/api/trends`, `/api/user/collection/insights`, `/api/catalog/cards/.../price-history`, `/api/tournament-platform/events`, `/api/buyer/recommendations`.

## Performance
Dynamic import do `LiveHomeFeed`; queries com `staleTime` 45–120s; skeletons existentes.
