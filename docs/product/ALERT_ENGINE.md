 # ALERT_ENGINE.md
**Versão:** 1.0  
**Status:** Public Beta  
**Base:** RC1 + Beta 2 Product Analytics Runtime

---

# Objetivo

O **Alert Engine** é o sistema central de monitoramento inteligente do Judge TCG Marketplace.

Seu objetivo é detectar automaticamente comportamentos anormais, oportunidades de negócio e degradações operacionais antes que afetem compradores, vendedores ou a receita da plataforma.

O Alert Engine é responsável por transformar métricas em ações.

---

# Missão

Responder continuamente:

- Existe alguma falha acontecendo agora?
- Algum KPI saiu da faixa saudável?
- Alguma feature parou de funcionar?
- A conversão caiu?
- O marketplace perdeu liquidez?
- Há eventos deixando de ser capturados?
- Alguma loja precisa de atenção?

---

# Arquitetura

```
Product Analytics Runtime

+

Telemetry

+

OpenTelemetry

+

Application Metrics

+

Marketplace Metrics

↓

Alert Engine

↓

Rules Engine

↓

Severity

↓

Notification

↓

Dashboard

↓

Action
```

---

# Componentes

```
Metrics Collector

↓

Rule Evaluator

↓

Threshold Engine

↓

Deduplication

↓

Notification Router

↓

Audit Log

↓

Incident Timeline
```

---

# Fontes de Dados

## Product Analytics

- analytics_events
- analytics_events_dlq
- funnels
- cohorts
- product_health

---

## Marketplace

- pedidos
- pagamentos
- catálogo
- sellers
- inventory
- shipping
- wishlist

---

## Infraestrutura

- OpenTelemetry
- Logs
- Traces
- Metrics
- Health endpoints

---

# Categorias

## Product

Conversão

Retenção

NSM

Funis

CTR

Bounce

---

## Marketplace

Pedidos

Frete

Pagamento

Catálogo

Oferta

Liquidez

---

## Search

CTR

Zero Results

Tempo

Relevância

---

## Seller

Pedidos

Conversão

Estoque

Cancelamentos

Avaliações

---

## Buyer

Wishlist

Carrinho

Checkout

Coleção

---

## Performance

LCP

CLS

INP

TTFB

Availability

Latency

---

## Analytics

DLQ

Lost Events

Schema

Health Score

---

# Severidade

## P0

Sistema indisponível

Perda financeira

Falha checkout

Falha pagamento

Banco indisponível

Analytics indisponível

---

## P1

Conversão caiu

Checkout degradado

Search quebrada

Wishlist parada

Marketplace indisponível parcialmente

---

## P2

Performance abaixo

CTR caiu

Zero Results aumentou

Seller sem estoque

Import lento

---

## P3

Recomendação

Mudança de tendência

Nova oportunidade

Insights

---

# Estados

```
Open

↓

Acknowledged

↓

Investigating

↓

Resolved

↓

Closed
```

---

# Estrutura

```
Alert

id

title

description

severity

category

metric

threshold

current_value

expected_value

created_at

resolved_at

owner

status

runbook

```

---

# Threshold Engine

Cada alerta possui

```
Operator

>

>=

<

<=

=

!=
```

---

Exemplo

```
Checkout Conversion

<

18%
```

---

# Janela

Cada regra define

```
5 min

15 min

30 min

1 h

6 h

24 h

7 dias

```

---

# Regras P0

## Checkout

```
Conversion

↓

20%

durante

15 min
```

---

## Payment

```
Falhas

>

5%
```

---

## API

```
Availability

<

99%
```

---

## Health

```
/health

!=

200
```

---

## Analytics

```
Lost Events

>

2%
```

---

## DLQ

```
DLQ

>

1%
```

---

# Regras P1

## Search

Zero Results

>

5%

---

CTR

↓

10%

---

Latency

>

600ms

---

# Marketplace

Pedidos

↓

25%

---

GMV

↓

20%

---

Liquidez

↓

15%

---

# Wishlist

Conversão

↓

30%

---

Disponibilidade

↓

20%

---

# Seller

Sem estoque

>

15%

---

Cancelamentos

>

5%

---

# Performance

LCP

>

2s

---

CLS

>

0.05

---

INP

>

200ms

---

# Product Health Score

```
PHS

<

80
```

---

# North Star

```
Pedidos

↓

15%
```

---

# Alertas Inteligentes

Detectar automaticamente

Tendência

Anomalia

Mudança

Sazonalidade

Outlier

---

# Alertas de Produto

Wishlist crescendo

Coleção crescendo

Deck Builder parado

Busca piorando

Conversão melhorando

---

# Alertas Financeiros

GMV

Ticket Médio

Receita

Chargeback

PIX

Stripe

---

# Alertas de Catálogo

Produtos sem imagem

Cards duplicadas

Sets incompletos

SKU inválido

Preço fora da curva

---

# Alertas de Sellers

Loja inativa

Tempo resposta alto

Avaliação baixa

Estoque zerado

Cancelamentos

---

# Alertas de Buyers

Carrinho abandonado

Wishlist atendida

Carta caiu de preço

Pedido enviado

Oferta disponível

---

# Destinos

Dashboard

Email

Discord

Slack

Webhook

OpenTelemetry

PagerDuty (futuro)

---

# Deduplicação

Mesmo alerta

↓

Atualiza contador

↓

Não cria incidente novo

---

# Agrupamento

Agrupar por

Categoria

Seller

Buyer

Marketplace

Feature

Release

---

# Rate Limit

Máximo

```
1 alerta

/

5 minutos

por regra
```

---

# Escalonamento

```
P3

↓

P2

↓

P1

↓

P0
```

Baseado em

Tempo

Impacto

Quantidade

---

# Runbooks

Todo alerta possui

```
runbook_url

owner

team

sla

```

---

# SLA

| Severidade | SLA |
|------------|------|
| P0 | 15 minutos |
| P1 | 1 hora |
| P2 | 8 horas |
| P3 | 48 horas |

---

# Dashboard

Mostrar

Alertas ativos

Alertas resolvidos

Tempo médio

MTTR

Top alertas

Top categorias

---

# KPIs

Alertas

Incidentes

MTTR

MTBF

False Positive

False Negative

---

# Integração

Consumirá

- PRODUCT_HEALTH_RUNTIME.md
- PRODUCT_METRICS.md
- NORTH_STAR.md
- FUNNEL_RUNTIME.md
- COHORT_RUNTIME.md
- EXECUTIVE_DASHBOARD.md
- BUYER_DASHBOARD.md
- SELLER_DASHBOARD.md
- SEARCH_DASHBOARD.md

---

# Governança

Toda regra deve possuir

- owner
- documentação
- justificativa
- impacto
- severidade
- SLA
- runbook
- versão

---

# Roadmap

## Beta 2

- Threshold Engine
- Regras estáticas
- Dashboard
- Alertas operacionais
- Product Health
- North Star

---

## Beta 3

- Machine Learning
- Anomaly Detection
- Forecasting
- Alertas preditivos
- Auto-escalonamento
- Root Cause Analysis
- Correlação entre eventos
- Recomendações automáticas

---

# Relação com a North Star

O Alert Engine protege continuamente a métrica principal do produto.

Sempre que houver degradação em:

- Pedidos concluídos
- Conversão
- Liquidez
- Performance
- Retenção
- Search
- Marketplace

o sistema deve gerar alertas automáticos para impedir impacto prolongado sobre a **North Star Metric** e sobre o **Product Health Score**.

---

# Resumo

O **Alert Engine** é a camada de inteligência operacional do Judge TCG Marketplace. Ele conecta Product Analytics, observabilidade e métricas de negócio para identificar problemas em tempo real, priorizar incidentes, reduzir o tempo de resposta e garantir que a plataforma mantenha alta disponibilidade, excelente experiência do usuário e crescimento sustentável durante o Public Beta e nas próximas versões.