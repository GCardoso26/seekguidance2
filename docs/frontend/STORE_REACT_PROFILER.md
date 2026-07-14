# Store React Profiler — RC1.1

**Método:** auditoria estática + Lighthouse TBT (Chrome Profiler DevTools não anexado nesta sessão).

## Antes

- `GameGrid` client: 2 queries (`catalog-games` + health) pós-hydrate
- Re-render ao chegar API / logo remoto

## Depois

| Componente | Renders client | Commit cost |
|---|---|---|
| GameCard / GameGridRsc | **0** (RSC) | — |
| LojaMarketplaceAlert | 1 isla | mínimo |
| MobileLayout/Header | 1 hydrate | dominante residual |
| CartDrawer | lazy | 0 até abrir |

**TBT medido `/loja`:** 10–30 ms.
