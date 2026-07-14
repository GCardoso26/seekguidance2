 # DATA_MARTS.md

**Versão:** 1.0  
**Status:** Public Beta (v1.0.0-beta)  
**Base:** Beta 2 — Product Analytics Runtime

---

# Objetivo

Este documento define a arquitetura dos **Data Marts** do Judge TCG Marketplace.

Os Data Marts representam a camada analítica responsável por transformar eventos brutos e dados operacionais em conjuntos de informações otimizados para consultas de negócio, dashboards, KPIs, experimentação e inteligência do produto.

Eles existem para evitar consultas complexas diretamente sobre eventos ou tabelas transacionais.

---

# Princípios

Os Data Marts devem seguir os seguintes princípios:

- Dados orientados ao negócio
- Atualização incremental
- Leitura otimizada
- Sem regras de domínio
- Fonte derivada (nunca fonte oficial)
- Reprocessáveis
- Versionáveis
- Auditáveis

---

# Arquitetura

```
Operational Database

Orders
Payments
Catalog
Wishlist
Search
Seller
Buyer

        │

        ▼

Analytics Events

analytics_events

        │

        ▼

Transformation Layer

ETL / Incremental Jobs

        │

        ▼

Data Marts

        │

        ▼

Dashboards
KPIs
Funnels
Cohorts
Alerts
Experiments
```

---

# Camadas

## Operational Layer

Fonte oficial do negócio.

Exemplos:

- pedidos
- pagamentos
- catálogo
- usuários
- vendedores
- estoque

Nunca consultar diretamente para dashboards.

---

## Event Layer

Eventos de comportamento.

Exemplos

```
page_view

search

card_view

wishlist_add

offer_click

purchase_completed

checkout_started
```

---

## Transformation Layer

Responsável por:

- agregação
- enriquecimento
- normalização
- deduplicação
- cálculo de métricas

Nenhuma regra visual.

---

## Data Mart Layer

Responsável pela leitura rápida.

É a camada consumida pelos dashboards.

---

# Organização dos Marts

```
analytics/

mart_product_metrics

mart_north_star

mart_product_health

mart_funnels

mart_cohorts

mart_search

mart_marketplace

mart_sellers

mart_buyers

mart_orders

mart_catalog

mart_inventory

mart_experiments

mart_alerts

```

---

# Mart Product Metrics

Objetivo

Centralizar todos os KPIs principais.

Granularidade

Diária

Campos

```
date

sessions

users

buyers

sellers

page_views

searches

wishlist_additions

offers_viewed

cart_additions

checkouts

orders

gmv

conversion_rate

retention

```

Atualização

A cada 5 minutos.

---

# Mart North Star

Objetivo

Calcular a métrica principal do produto.

Campos

```
date

orders

buyers_active

sellers_active

gmv

orders_per_buyer

orders_per_seller

market_liquidity

north_star_score

```

---

# Mart Product Health

Objetivo

Calcular o Product Health Score.

Campos

```
conversion_score

performance_score

availability_score

error_score

retention_score

engagement_score

satisfaction_score

overall_score

```

---

# Mart Funnels

Objetivo

Materializar todos os funis.

Granularidade

Por etapa.

Campos

```
funnel

step

users

conversion

dropoff

completion

date

```

---

# Mart Cohorts

Objetivo

Retenção.

Campos

```
cohort

period

users

retained

retention_rate

ltv

orders

gmv

```

---

# Mart Marketplace

Responsável por métricas gerais.

Campos

```
cards

offers

stores

active_listings

inventory

buyers

searches

orders

gmv

```

---

# Mart Search

Campos

```
query

normalized_query

results

clicks

ctr

zero_results

avg_position

avg_latency

filters_used

tcg

language

```

---

# Mart Sellers

Campos

```
seller_id

sales

orders

gmv

conversion

inventory

response_time

rating

refunds

chargebacks

```

---

# Mart Buyers

Campos

```
buyer_id

sessions

orders

gmv

wishlist

decks

searches

retention

ltv

```

---

# Mart Orders

Campos

```
order_id

seller

buyer

status

payment

shipping

gmv

margin

fee

escrow

```

---

# Mart Inventory

Campos

```
seller

cards

quantity

reserved

sold

availability

stock_turnover

```

---

# Mart Catalog

Campos

```
cards

games

sets

variants

foil

languages

rarities

availability

```

---

# Mart Experiments

Campos

```
experiment

variant

users

conversion

gmv

ctr

winner

confidence

```

---

# Mart Alerts

Campos

```
alert

severity

status

opened

resolved

owner

duration

```

---

# Atualização

Cada mart possui estratégia própria.

## Near Real Time

- Product Metrics
- North Star
- Product Health

Intervalo

5 minutos

---

## Horária

- Search
- Marketplace
- Sellers

Intervalo

1 hora

---

## Diária

- Cohorts
- Experiments
- Executive KPIs

---

# Incremental Load

Sempre incremental.

```
last_processed_event

↓

new_events

↓

aggregation

↓

upsert mart
```

Nunca reconstruir tudo sem necessidade.

---

# Chaves

Cada mart possui chave natural.

Exemplos

```
date

seller_id

buyer_id

query

experiment

cohort
```

---

# Reprocessamento

Todo mart deve permitir

```
truncate

↓

rebuild

↓

validation
```

Sem impacto operacional.

---

# Consistência

Comparações obrigatórias

```
orders mart

=

orders domínio

GMV mart

=

GMV financeiro

buyers mart

=

buyers ativos
```

Diferenças geram alertas.

---

# Qualidade

Cada mart publica

```
updated_at

row_count

source_events

processing_time

validation_status

```

---

# Governança

Todo Data Mart deve possuir

- owner
- descrição
- origem
- frequência
- consumidor
- SLA
- versão

---

# SLA

| Mart | Atualização |
|--------|-------------|
| Product Metrics | 5 min |
| North Star | 5 min |
| Product Health | 5 min |
| Search | 1 h |
| Marketplace | 1 h |
| Sellers | 1 h |
| Buyers | 1 h |
| Orders | 1 h |
| Inventory | 1 h |
| Cohorts | diário |
| Experiments | diário |
| Executive | diário |

---

# Consumo

Os Data Marts alimentam

- Executive Dashboard
- Seller Dashboard
- Buyer Dashboard
- Search Dashboard
- Alert Engine
- Product Health Runtime
- Experiment Runtime
- North Star Runtime

Nenhum dashboard deve consultar diretamente analytics_events.

---

# Boas práticas

## Permitido

- agregações
- métricas
- joins
- snapshots
- indicadores
- rankings

## Não permitido

- regras de negócio
- cálculos financeiros oficiais
- mutações
- escrita operacional

---

# Roadmap

## Beta 2

- Product Metrics Mart
- Funnel Mart
- Cohort Mart
- Marketplace Mart
- Seller Mart
- Buyer Mart
- Search Mart
- Product Health Mart

---

## Beta 3

- Feature Store
- Session Mart
- Recommendation Mart
- AI Insights Mart
- Forecast Mart
- Fraud Signals Mart
- Pricing Intelligence Mart
- Marketplace Liquidity Mart

---

# Relação com os documentos

Os Data Marts são a base para:

- PRODUCT_METRICS.md
- NORTH_STAR.md
- PRODUCT_HEALTH_RUNTIME.md
- FUNNEL_RUNTIME.md
- COHORT_RUNTIME.md
- EXECUTIVE_DASHBOARD.md
- SELLER_DASHBOARD.md
- BUYER_DASHBOARD.md
- SEARCH_DASHBOARD.md
- ALERT_ENGINE.md
- EXPERIMENT_RUNTIME.md
- ANALYTICS_RUNTIME_ARCHITECTURE.md

---

# Resumo

A camada de **Data Marts** é responsável por transformar eventos e dados operacionais em informações prontas para consumo analítico. Ela desacopla o produto das consultas pesadas, garante consistência dos indicadores, reduz o custo computacional dos dashboards e cria a fundação necessária para Product Analytics, Experimentação, IA Analítica e tomada de decisão em tempo real.
---

## Beta 2 Implementation Note

Runtime implementado em `services/api/app/analytics_runtime/`.

- Materializa Data Marts; dashboards internos via `GET /runtime/*`.
- Metric Engine: `registry/metrics.py` (validate_registry).
- Relatório: `docs/product/BETA2_RUNTIME_REPORT.md` · `context/beta2-product-analytics-runtime.md`.
