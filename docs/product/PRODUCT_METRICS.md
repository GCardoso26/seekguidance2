 # Product Metrics
**Versão:** 1.0  
**Status:** Public Beta  
**Base:** RC1 + Beta 1.5 Event Integrity + Beta 2 Product Analytics Runtime

---

# Objetivo

Este documento define a fonte única de verdade (Single Source of Truth) para todas as métricas oficiais do Judge TCG Marketplace.

Nenhuma dashboard, relatório, experimento ou algoritmo poderá utilizar métricas diferentes das definidas neste documento.

---

# Princípios

Toda métrica oficial deve possuir:

- ID único
- Nome
- Owner
- Categoria
- Objetivo
- Fórmula
- Fonte
- Frequência
- SLA
- Criticidade
- Dashboard(s)
- Alertas

---

# Categorias

## Marketplace

Métricas relacionadas à liquidez e funcionamento do marketplace.

## Buyers

Comportamento dos compradores.

## Sellers

Saúde operacional dos vendedores.

## Search

Qualidade do mecanismo de busca.

## Checkout

Conversão financeira.

## Performance

Velocidade da plataforma.

## Analytics

Saúde da instrumentação.

## Reliability

Disponibilidade da aplicação.

---

# Marketplace Metrics

---

## GMV

ID

```
gmv
```

Descrição

Valor bruto negociado.

Owner

Marketplace

Fórmula

```
SUM(order_total)
```

Fonte

Orders

Refresh

5 minutos

Criticidade

★★★★★

Dashboard

Executive

Marketplace

---

## Take Rate

ID

```
take_rate
```

Descrição

Receita percentual do marketplace.

Fórmula

```
Marketplace Revenue

/

GMV
```

Meta

Maior que 8%

---

## Marketplace Revenue

```
SUM(platform_fee)
```

---

## Orders

```
COUNT(orders)
```

---

## Completed Orders

```
COUNT(order_completed)
```

---

## Cancel Rate

```
cancelled_orders

/

orders
```

Meta

<2%

---

# Buyer Metrics

---

## DAU

Daily Active Users

```
COUNT(DISTINCT buyer_id)
```

Janela

24h

---

## WAU

```
7 dias
```

---

## MAU

```
30 dias
```

---

## Buyer Retention 7

```
Buyers ativos após 7 dias

/

Novos buyers
```

---

## Buyer Retention 30

Mesmo conceito.

---

## Wishlist Creation Rate

```
wishlist_created

/

buyers
```

---

## Wishlist Conversion

```
Purchase originada da wishlist

/

wishlist visits
```

---

## Cart Conversion

```
checkout_started

/

cart_opened
```

---

## Checkout Conversion

```
purchase_completed

/

checkout_started
```

Meta

Maior que 70%

---

## Average Order Value

```
GMV

/

Orders
```

---

## Buyer Lifetime Value

```
Σ pedidos buyer
```

---

# Seller Metrics

---

## Sellers Active

```
seller_login
```

---

## Sellers With Sales

```
seller_id

com

>=1 venda
```

---

## First Sale Time

```
Data primeira venda

-

Cadastro
```

---

## Inventory Availability

```
Produtos disponíveis

/

Produtos cadastrados
```

---

## Listing Conversion

```
Produto vendido

/

Produto anunciado
```

---

## Seller Retention

7 dias

30 dias

90 dias

---

## Average Inventory Age

```
Dias anúncio

até venda
```

---

# Search Metrics

---

## Searches

```
COUNT(search)
```

---

## Search CTR

```
Card Click

/

Search
```

Meta

>35%

---

## Zero Result Rate

```
Search sem resultado

/

Search
```

Meta

<5%

---

## Search Success Rate

```
Busca

↓

Card View
```

---

## Average Search Time

Tempo médio.

Meta

<300ms

---

## Autocomplete Usage

```
autocomplete_used

/

search
```

---

# Catalog Metrics

---

## Card Views

```
card_view
```

---

## Offer Views

```
offer_view
```

---

## Card Buy Click

```
card_buy_click
```

---

## Product Detail Conversion

```
Cart

/

Card View
```

---

# Checkout Metrics

---

## Checkout Started

```
checkout_started
```

---

## Checkout Completed

```
purchase_completed
```

---

## Checkout Abandonment

```
checkout_started

-

purchase_completed
```

Meta

<20%

---

## Payment Success

```
payment_success

/

payment_attempt
```

---

## PIX Usage

```
PIX

/

Total pagamentos
```

---

## Stripe Usage

```
Stripe

/

Total
```

---

# Inventory Metrics

---

## Available Products

```
availability=true
```

---

## Out of Stock

```
stock=0
```

---

## Inventory Freshness

```
updated_at
```

---

## Import Success

```
Import sucesso

/

Importações
```

---

# Performance Metrics

---

## Lighthouse

Meta

>=95

---

## LCP

Meta

<2s

---

## CLS

Meta

<0.05

---

## INP

Meta

<200ms

---

## TTFB

Meta

<500ms

---

## Shared Bundle

Meta

<350KB (curto prazo)

<250KB (médio prazo)

---

# Reliability Metrics

---

## Availability

```
200 OK

/

Requests
```

Meta

99.9%

---

## API Error Rate

```
5xx

/

Requests
```

Meta

<0.5%

---

## BFF Error Rate

Mesmo conceito.

---

## DLQ Rate

```
DLQ

/

Eventos
```

Meta

<1%

---

## Persist Ratio

```
Persistidos

/

Recebidos
```

Meta

99%

---

# Product Analytics Metrics

---

## Analytics Health Score

Documento

```
ANALYTICS_HEALTH.md
```

Faixa

0–100

Meta

>=90

---

## Product Health Score

Documento

```
PRODUCT_HEALTH_RUNTIME.md
```

Meta

>=90

---

## North Star

Documento

```
NORTH_STAR.md
```

---

# North Star Metric

Métrica oficial do produto

```
Pedidos concluídos

últimos 7 dias
```

Guardrails

- Buyers ativos
- Sellers ativos
- GMV
- Conversão
- Performance
- Analytics Health

---

# Dashboards Oficiais

Executive

Marketplace

Buyers

Sellers

Inventory

Search

Checkout

Analytics

Product Health

Operations

---

# Owners

| Área | Responsável |
|--------|-------------|
| Marketplace | Product |
| Buyers | Product |
| Sellers | Marketplace |
| Search | Search Team |
| Checkout | Payments |
| Performance | Frontend |
| Analytics | Data Platform |
| Reliability | Platform |

---

# SLA de Atualização

| Categoria | Refresh |
|------------|----------|
| Executive | 5 min |
| Marketplace | 5 min |
| Checkout | Tempo real |
| Search | 5 min |
| Buyers | 15 min |
| Sellers | 15 min |
| Performance | 5 min |
| Reliability | Tempo real |
| Analytics | Tempo real |

---

# Alertas

Toda métrica crítica deve possuir regra de alerta.

Exemplos:

- Conversão ↓20%
- GMV ↓15%
- LCP >2s
- Search CTR ↓15%
- DLQ >1%
- Persist Ratio <99%
- Checkout <70%
- API Error >0.5%

---

# Governança

Nenhuma dashboard poderá:

- calcular métricas manualmente;
- utilizar SQL diferente da fórmula oficial;
- criar KPIs locais;
- alterar definições sem revisão do Product Team.

Toda nova métrica deverá:

1. Ser registrada neste documento.
2. Possuir owner.
3. Possuir fórmula oficial.
4. Possuir fonte de dados.
5. Possuir dashboard.
6. Possuir alerta.
7. Possuir documentação.
8. Possuir testes automatizados.
---

## Beta 2 Implementation Note

Runtime implementado em `services/api/app/analytics_runtime/`.

- Materializa Data Marts; dashboards internos via `GET /runtime/*`.
- Metric Engine: `registry/metrics.py` (validate_registry).
- Relatório: `docs/product/BETA2_RUNTIME_REPORT.md` · `context/beta2-product-analytics-runtime.md`.
