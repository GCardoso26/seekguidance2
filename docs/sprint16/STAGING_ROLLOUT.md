# Sprint 16 — Staging Rollout (Release Candidate)

## Variáveis obrigatórias

### Backend (Render / API)

```env
SHIPPING_V2_ENABLED=true
```

### Frontend (Vercel)

```env
NEXT_PUBLIC_FEATURE_WISHLIST_V2=true
NEXT_PUBLIC_FEATURE_SHIPPING_V2=true
```

## Checklist pós-deploy staging

1. Confirmar migração `sprint15_wishlist_shipping_analytics` aplicada (`wishlist_lists`, `shipping_quote_read_model`).
2. `GET /v1/health` → `features.shipping_v2: true` (backend).
3. `GET /api/health` (frontend staging) → `features.wishlist_v2` e `features.shipping_v2` ambos `true`.
4. `GET /runtime/judge/buyer/wishlists` retorna listas seed para usuário autenticado.
5. `GET /runtime/judge/buyer/shipping/quote?destination_postal_code=01310100` retorna cotações.
6. Smoke buyer: dashboard → wishlist → smart cart → checkout.
7. Monitorar por 24h: latência P95, taxa de erro 5xx, abandono de checkout.

## Canary produção (WISHLIST_V2)

1. Habilitar `NEXT_PUBLIC_FEATURE_WISHLIST_V2=true` para 5% do tráfego (feature flag Vercel).
2. Validar eventos: `wishlist_created`, `wishlist_shared`, `wishlist_converted`.
3. Expandir para 25% → 50% → 100% se métricas estáveis.

## Rollback

- Desligar flags (`WISHLIST_V2`, `SHIPPING_V2`, `SHIPPING_V2_ENABLED`).
- API legacy `/marketplace/wishlist` continua disponível como fallback flat.
