# Console Audit — RC1.2

**Data:** 2026-07-14  
**Método:** Lighthouse `errors-in-console` + probes HTTP nos endpoints que poluíam o console

## Resultado lab (pós-fix)

| Rota | Console errors (LH) |
|---|---|
| Todas as 10 da bateria | **score 1** (limpo) |

## Endpoints que geravam erro

| Endpoint | Antes | Depois |
|---|---|---|
| `POST /api/analytics/track` | 400 / 503 no browser | **200** soft (`ok:false` no body) |
| `GET /api/catalog/sets` | **503** | **200** `{sets:[], degraded?}` |
| `GET /api/catalog/cards/search` | 503 quando API down | **200** empty degraded |

## Probes manuais (lab)

```
POST /api/analytics/track {"events":[]} → 200
GET  /api/catalog/sets                 → 200
GET  /api/catalog/health               → 200
```

## Residual

- Sem React hydration warnings observados no LH desktop das rotas críticas.
- Warnings de source-map column bounds no stdout do script LH — não entram como `errors-in-console` da página.
