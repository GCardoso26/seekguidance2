# Staging Runbook — RC1

**Modo:** validação de processo apenas — **sem deploy** nesta execução.

## Pré-requisitos

1. Billing GitHub Actions restaurado (opcional para staging, obrigatório para CI).  
2. Acesso Vercel preview/staging + Render staging.  
3. Migração Sprint 15 aplicada (`wishlist_lists`, shipping read models).

## Env alvo

### API

```env
SHIPPING_V2_ENABLED=true
```

### Frontend

```env
NEXT_PUBLIC_FEATURE_WISHLIST_V2=true
NEXT_PUBLIC_FEATURE_SHIPPING_V2=true
```

## Checklist (não executado em 2026-07-13)

- [ ] Deploy staging API + FE  
- [ ] `GET /v1/health` → `features.shipping_v2: true`  
- [ ] `GET /api/health` → 200, `wishlist_v2` + `shipping_v2` true, DB ok  
- [ ] Wishlist lists autenticado  
- [ ] Shipping quote CEP 01310-100  
- [ ] Smoke buyer: dashboard → wishlist → smart cart → checkout  
- [ ] Seller dashboard + `/vendedor/painel/estoque`  
- [ ] Inventory search/adjust dry-run  
- [ ] Monitor 24h P95 / 5xx  

## Rollback staging

Desligar flags; legacy wishlist flat permanece.

## Referência

`docs/sprint16/STAGING_ROLLOUT.md`
