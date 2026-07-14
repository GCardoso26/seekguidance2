# Top Movers Audit — Fase 1.4

**Version:** 1.0.0  
**Date:** 2026-07-14  
**Status:** Pre-recovery

---

## Rotas encontradas

| Rota | Estado |
|------|--------|
| `/loja/tendencias` | Placeholder client (`TopMoversPlaceholder`) |
| `/mercado` | Top movers reais MTG-only (`TopMoversTable` + Supabase N+1) |
| `/top-movers` | Inexistente |

---

## Componentes / CSS / débitos

| Item | Achado |
|------|--------|
| `TopMoversPlaceholder.tsx` | Hardcoded; mensagem “Fase 1.4” |
| `lib/market/top-movers.ts` | N+1 Supabase; não usa Data Marts |
| `TrendingCardsGrid` | `/api/trends` (catalog BE), não analytics_runtime |
| luxury / text-white / bg-black | **Ausentes** nos arquivos da feature |
| PageShell / MetricCard / SectionHeader | MetricCard/SectionHeader/PageContainer **não existiam** no DS (criados nesta fase) |
| Hooks dedicados | Nenhum |
| Eventos product analytics | Nenhum `top_movers_*` |

---

## Problemas

1. Duas fontes de verdade (placeholder vs mercado vs catalog trends).  
2. FE recalcula / consulta preços diretamente (fora do Runtime).  
3. Sem RSC-first na rota loja/tendencias (`"use client"` root).  
4. Sem integração Metric Registry / marts Beta 2.  
5. Sem instrumentação Event Registry.

---

## Plano de recovery (executado)

1. `mart_top_movers` (+ composições marketplace/product_metrics).  
2. `GET /runtime/top-movers` (somente marts).  
3. `/loja/tendencias` RSC + islands DS v3.  
4. Eventos `top_movers_*` no registry.  
5. Remover placeholder da home crítica.
