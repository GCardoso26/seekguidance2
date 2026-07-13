# Canary Plan — RC1 → Public Beta

**Status:** preparado — **não executar** até Go + staging OK.

## Estratégia de tráfego

| Fase | % | Duração mínima | Gate de avanço |
|---|---:|---|---|
| C1 | 5% | 24h | erro 5xx < baseline+0.5pp; checkout success estável |
| C2 | 25% | 24–48h | idem + wishlist/shipping events ok |
| C3 | 100% | — | sign-off Release Manager |

## Ordem de flags

1. `WISHLIST_V2` (FE)  
2. `SHIPPING_V2` / `SHIPPING_V2_ENABLED` após wishlist estável  

Inventory **sem** flag dedicada — já em `main`; monitorar erros seller inventory.

## KPIs

- Taxa 5xx FE/API  
- Latência P95 BFF  
- Checkout completion  
- Eventos: `wishlist_*`, shipping quote failures  
- Inventory adjust/search error rate  

## Alertas / Owner

| Alerta | Owner |
|---|---|
| 5xx spike | On-call backend |
| BFF health 503 | Frontend/platform |
| Checkout drop | Marketplace |

## Rollback

1. Reverter % canary para 0 / desligar flags.  
2. Reverter deploy para tag anterior (quando existir).  
3. Comunicar em incident channel.

## Plantão

Definir janela comercial BR + owner nomeado **antes** de C1.
