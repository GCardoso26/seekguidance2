 # METRIC_REGISTRY.md

**Versão:** 1.0  
**Status:** Public Beta (v1.0.0-beta)  
**Base:** Beta 2 — Product Analytics Runtime

---

# Objetivo

O **Metric Registry** é o catálogo oficial de todas as métricas utilizadas pelo Judge TCG Marketplace.

Seu objetivo é garantir que toda métrica:

- possua uma única definição oficial;
- seja calculada sempre da mesma forma;
- tenha um owner responsável;
- possua origem conhecida;
- seja auditável;
- seja versionável;
- seja reutilizada por todos os dashboards.

Nenhum dashboard pode criar métricas próprias.

---

# Princípios

Todas as métricas devem possuir:

- nome único
- descrição
- owner
- categoria
- fórmula
- origem dos dados
- frequência
- granularidade
- unidade
- SLA
- versão
- consumidores

---

# Estrutura

Cada métrica deve seguir o seguinte formato.

```yaml
id:

name:

description:

category:

owner:

version:

formula:

source:

refresh_interval:

granularity:

unit:

target:

warning_threshold:

critical_threshold:

consumers:
```

---

# Categorias

As métricas são agrupadas em:

## Marketplace

- GMV
- pedidos
- compradores
- vendedores
- liquidez

---

## Produto

- sessões
- usuários ativos
- retenção
- engajamento
- conversão

---

## Search

- CTR
- Zero Results
- Latência
- Conversão por busca

---

## Seller

- vendas
- estoque
- reputação
- conversão

---

## Buyer

- wishlist
- deck builder
- recompra
- LTV

---

## Performance

- LCP
- CLS
- INP
- TTFB

---

## Analytics

- ingestão
- perda
- duplicação
- schema

---

## Qualidade

- Product Health
- Analytics Health
- Error Rate

---

# Convenções

Todos os nomes utilizam snake_case.

Exemplo

```
orders_completed

gmv

conversion_rate

buyers_active

seller_conversion

wishlist_ctr
```

Nunca utilizar espaços.

---

# Convenções de unidade

| Unidade | Exemplo |
|------------|----------|
| count | pedidos |
| currency | GMV |
| percentage | conversão |
| milliseconds | LCP |
| seconds | tempo |
| ratio | CTR |
| score | Product Health |

---

# Marketplace

## orders_completed

Descrição

Pedidos concluídos.

Categoria

Marketplace

Fonte

Orders

Fórmula

```
COUNT(order.status = completed)
```

Granularidade

Diária

Target

↑

---

## gmv

Descrição

Volume bruto negociado.

Fonte

Orders

Fórmula

```
SUM(order.total)
```

Unidade

BRL

---

## average_order_value

Descrição

Ticket médio.

Fórmula

```
GMV

/

Orders
```

---

## marketplace_liquidity

Descrição

Liquidez do marketplace.

Fórmula

```
buyers_active

×

sellers_active

×

conversion_rate
```

---

# Produto

## sessions

Fonte

Analytics

Evento

page_view

---

## active_users

Fonte

Analytics

Critério

Usuários únicos em 24h.

---

## retention_d30

Descrição

Retenção em 30 dias.

---

## activation_rate

Descrição

Usuários que completaram onboarding.

---

## engagement_score

Descrição

Score composto.

Componentes

```
sessions

+

searches

+

wishlist

+

orders
```

---

# Conversão

## conversion_rate

Fórmula

```
Orders

/

Sessions
```

---

## checkout_conversion

Fórmula

```
Purchase

/

Checkout Started
```

---

## cart_conversion

```
Purchase

/

Cart Opened
```

---

## wishlist_conversion

```
Purchase

/

Wishlist Visit
```

---

# Search

## search_ctr

```
Offer Click

/

Search
```

---

## zero_result_rate

```
Zero Results

/

Searches
```

---

## search_latency

```
AVG(search_duration)
```

---

## search_success_rate

```
Searches com clique

/

Searches
```

---

# Seller

## seller_gmv

GMV por vendedor.

---

## seller_orders

Pedidos.

---

## seller_conversion

```
Orders

/

Visits
```

---

## seller_inventory_turnover

```
Sold

/

Average Inventory
```

---

## seller_response_time

Tempo médio.

---

## seller_rating

Média de avaliações.

---

# Buyer

## buyer_ltv

Lifetime Value.

---

## buyer_orders

Pedidos.

---

## buyer_retention

Retenção.

---

## buyer_wishlist_size

Itens em wishlist.

---

## buyer_decks

Quantidade de decks.

---

# Catálogo

## catalog_cards

Total.

---

## active_offers

Ofertas ativas.

---

## sellers_with_inventory

Vendedores ativos.

---

## inventory_available

Quantidade disponível.

---

# Analytics

## ingestion_success_rate

```
Persisted

/

Received
```

---

## analytics_health_score

Definido em

PRODUCT_HEALTH_RUNTIME.md

---

## dead_letter_rate

```
DLQ

/

Received
```

---

## duplicate_event_rate

```
Duplicated

/

Received
```

---

# Performance

## lcp

Target

```
<2s
```

---

## cls

```
<0.05
```

---

## inp

```
<200ms
```

---

## ttfb

```
<500ms
```

---

# Lighthouse

## lighthouse_performance

Target

95+

---

## lighthouse_accessibility

Target

100

---

## lighthouse_best_practices

Target

100

---

## lighthouse_seo

Target

100

---

# Product Health

## product_health_score

Calculado em

PRODUCT_HEALTH_RUNTIME.md

---

## analytics_health_score

Calculado em

ANALYTICS_HEALTH.md

---

# North Star

## north_star_orders

Descrição

Pedidos concluídos em 7 dias.

Fonte

Orders.

---

## north_star_growth

```
Current

/

Previous
```

---

## liquidity_guardrail

```
buyers_active

+

sellers_active
```

---

# Alertas

Cada métrica possui thresholds.

Exemplo

```yaml
warning: 90

critical: 80
```

ou

```yaml
warning: 2%

critical: 5%
```

---

# Owners

Cada métrica possui owner.

Exemplo

```yaml
Marketplace Team

Analytics Team

Search Team

Seller Team

Platform Team
```

---

# Frequências

| Frequência | Uso |
|------------|-----|
| Near Real Time | dashboards |
| 5 min | Product Health |
| 1 h | Seller |
| Diário | Executive |
| Semanal | Cohorts |
| Mensal | LTV |

---

# Versionamento

Toda alteração gera nova versão.

Exemplo

```
conversion_rate

v1

↓

v2
```

Mudanças nunca sobrescrevem a definição anterior.

---

# Auditoria

Cada métrica publica

```
last_updated

source

version

row_count

processing_time

owner
```

---

# Governança

Nenhuma métrica pode:

- possuir duas definições;
- utilizar SQL diferente em dashboards;
- ser recalculada manualmente;
- existir fora do Registry.

---

# Consumo

O Metric Registry é utilizado por:

- Executive Dashboard
- Seller Dashboard
- Buyer Dashboard
- Search Dashboard
- Product Health Runtime
- Alert Engine
- Experiment Runtime
- North Star Runtime
- Data Marts
- IA Analítica

---

# Roadmap

## Beta 2

- Registry oficial
- Versionamento
- Owners
- Thresholds
- Auditoria

---

## Beta 3

- Catálogo navegável
- Aprovação automática
- Descoberta por tags
- Histórico temporal
- Dependências entre métricas
- Impact Analysis
- Data Lineage
- OpenMetrics/OpenTelemetry Export

---

# Relação com os documentos

Este documento complementa:

- PRODUCT_METRICS.md
- NORTH_STAR.md
- PRODUCT_HEALTH_RUNTIME.md
- ANALYTICS_RUNTIME_ARCHITECTURE.md
- DATA_MARTS.md
- EXECUTIVE_DASHBOARD.md
- SELLER_DASHBOARD.md
- BUYER_DASHBOARD.md
- SEARCH_DASHBOARD.md
- ALERT_ENGINE.md
- EXPERIMENT_RUNTIME.md

---

# Resumo

O **Metric Registry** é a fonte única de verdade para todas as métricas do Judge TCG Marketplace. Ele elimina divergências entre dashboards, padroniza cálculos, garante governança sobre indicadores estratégicos e fornece a base necessária para Product Analytics, IA Analítica, experimentação, monitoramento operacional e decisões orientadas por dados durante o Public Beta e nas futuras versões da plataforma.
---

## Beta 2 Implementation Note

Runtime implementado em `services/api/app/analytics_runtime/`.

- Materializa Data Marts; dashboards internos via `GET /runtime/*`.
- Metric Engine: `registry/metrics.py` (validate_registry).
- Relatório: `docs/product/BETA2_RUNTIME_REPORT.md` · `context/beta2-product-analytics-runtime.md`.
