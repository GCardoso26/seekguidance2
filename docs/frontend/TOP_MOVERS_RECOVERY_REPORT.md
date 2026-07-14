# TOP MOVERS — Fase 1.4 Executive Report

**Date:** 2026-07-14  
**Status:** Recovery complete

---

## Nota visual antes / depois

| | Nota |
|--|------|
| Antes | **3.0 / 10** — placeholder isolado, copy “Fase 1.4”, sem terminal |
| Depois | **8.5 / 10** — hero métricas, grids, filtros, tabela DS, insights |

---

## Componentes migrados / criados

- Página RSC `/loja/tendencias`
- `TopMoversPanels`, `TopMoversFiltersIsland`, `TopMoversTableIsland`
- DS: `MetricCard`, `SectionHeader`, `PageContainer`
- Home teaser `TopMoversPlaceholder` → Runtime API

---

## Runtime

- `GET /runtime/top-movers` (+ BFF `/api/runtime/top-movers`)
- Marts: `mart_top_movers`, `mart_marketplace`, `mart_product_metrics` (+ orders/search/catalog/health)
- **Zero** leitura de `analytics_events` na UI

---

## Performance / Lighthouse (alvo)

| Gate | Meta | Estado lab |
|------|------|------------|
| RSC-first + islands | sim | entregue |
| Perf | ≥95 | não re-executado em prod nesta sessão (estrutura alinhada RC1) |
| A11y | 100 | contraste tokens + ARIA filtros/tabela |
| SEO | canonical + JSON-LD + breadcrumb | entregue |

---

## Testes

- pytest analytics_runtime + event integrity + top_movers: **PASS**
- ruff (escopo runtime): **PASS**
- type-check: **PASS**
- ds:audit: **PASS** (0–1 hit, sob limiar)

---

## Dívida técnica

1. Persistência de preços reais no materializer (hoje seed + catalog snapshot).  
2. Tabs Set/Idioma/Raridade ainda não densos (filtros game/period/sort/foil).  
3. Lighthouse prod dedicado à rota `/loja/tendencias` pendente.  
4. Playwright e2e específico Top Movers pendente.  
5. `/mercado` ainda usa path Supabase legado (fora do escopo desta rota).

---

## Beta 3 — Product Intelligence

O Copilot Executivo deve:

1. Ler `mart_top_movers` + Metric Registry.  
2. Explicar entrada de uma carta (Δ%, volume, liquidez, foil share, game mix).  
3. Nunca citar `analytics_events` brutos.  
4. Correlacionar com Product Health / North Star guardrails.
