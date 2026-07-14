 # ANALYTICS_RUNTIME_ARCHITECTURE.md

**Versão:** 1.0  
**Status:** Public Beta (v1.0.0-beta)  
**Base:** RC1 + Beta 2 Product Analytics Runtime

---

# Objetivo

Este documento define a arquitetura oficial do **Analytics Runtime** do Judge TCG Marketplace.

O Analytics Runtime é a plataforma responsável por transformar todos os eventos produzidos pelo marketplace em inteligência de produto, indicadores executivos e decisões orientadas por dados.

Diferentemente da telemetria técnica (OpenTelemetry), este runtime é orientado ao negócio.

Ele mede comportamento.

Não infraestrutura.

---

# Princípios

Toda funcionalidade deve ser mensurável.

Nenhum evento pode desaparecer silenciosamente.

Analytics nunca pode ser fonte de verdade financeira.

Pedidos, pagamentos e domínio continuam sendo a verdade absoluta.

Analytics existe para explicar o comportamento que levou até esses resultados.

---

# Visão Geral

```
Frontend

↓

Analytics SDK

↓

Client Queue

↓

Batch / Retry

↓

API Gateway

↓

Validation

↓

Event Registry

↓

Schema Validation

↓

Deduplication

↓

Persistence

↓

Analytics Database

↓

Transformation Layer

↓

Runtime Marts

↓

Dashboards

↓

Alerts

↓

Experiments

↓

Executivos
```

---

# Camadas

## 1. Client SDK

Responsável por:

- track()
- identify()
- page()
- group()
- flush()

Funções

- fila local
- retry
- offline queue
- idempotência
- batching

Não conhece banco.

Não conhece dashboards.

---

## 2. Event Gateway

Primeira camada do backend.

Responsável por:

- autenticação
- rate limit
- schema
- versionamento
- deduplicação
- enrichment

Nunca grava diretamente sem validação.

---

## 3. Event Registry

Fonte única da verdade sobre eventos suportados.

Cada evento possui

```
nome

owner

schema

versão

categoria

status

payload

```

Nenhum evento pode existir fora do Registry.

---

# Registry

Exemplo

```
purchase_completed

owner:
Marketplace

version:
v1

schema:
purchase.v1.json

```

---

# Schema Validation

Todo evento deve possuir

```
JSON Schema

↓

Validation

↓

Accept

ou

Reject
```

Eventos inválidos

↓

DLQ

Nunca descartados silenciosamente.

---

# Event Enrichment

Adicionar automaticamente

```
timestamp

request_id

ingestion_trace_id

country

device

browser

platform

session

release_version

experiment_variant

feature_flags

```

---

# Idempotência

Todo evento possui

```
event_id

idempotency_key

```

Duplicados

↓

Ignorados

---

# Persistence

Eventos válidos

↓

analytics_events

---

Eventos inválidos

↓

analytics_events_dlq

---

Nunca perder rastreabilidade.

---

# Data Flow

```
Client

↓

Gateway

↓

Registry

↓

Schema

↓

Persist

↓

Runtime

↓

Dashboards
```

---

# Runtime Layer

Responsável por construir

Product Metrics

↓

Funnels

↓

Cohorts

↓

North Star

↓

Product Health

↓

Alerts

↓

Experiments

↓

Dashboards

---

# Runtime Tables

analytics_events

analytics_events_dlq

product_metrics

funnels

cohorts

north_star

product_health

alerts

experiments

feature_flags

---

# Runtime Services

## Metrics Engine

Calcula

CTR

Conversão

Retenção

Tempo

Pedidos

Receita

---

## Funnel Engine

Calcula

Entrada

Saída

Conversão

Abandono

---

## Cohort Engine

Calcula

Retenção

Lifetime

Recompra

Liquidez

---

## Product Health Engine

Calcula

Product Health Score

---

## Alert Engine

Avalia

Thresholds

Anomalias

Incidentes

---

## Experiment Engine

Gerencia

A/B

Canary

Rollout

Feature Flags

---

# Runtime APIs

```
/runtime/product

/runtime/metrics

/runtime/north-star

/runtime/funnels

/runtime/cohorts

/runtime/alerts

/runtime/dashboard

/runtime/experiments

/runtime/search

/runtime/sellers

/runtime/buyers

/runtime/analytics-health

```

---

# Dashboards

Executive

↓

Seller

↓

Buyer

↓

Marketplace

↓

Search

↓

Operations

↓

Experiments

---

# North Star

Fonte

Pedidos

↓

North Star Runtime

↓

Executivo

---

Nunca usar analytics_events para receita oficial.

Sempre cruzar com domínio.

---

# Product Health

Entrada

```
Conversão

Retenção

Performance

Disponibilidade

Erros

Uso

Satisfação
```

↓

Score

↓

Dashboard

↓

Alertas

---

# Observabilidade

Analytics Runtime publica

```
Latency

Availability

Persist Ratio

DLQ

Schema Errors

Lost Events

```

Integrado ao

OpenTelemetry

---

# Event Lifecycle

```
Created

↓

Queued

↓

Sent

↓

Received

↓

Validated

↓

Persisted

↓

Processed

↓

Aggregated

↓

Archived
```

---

# Versionamento

Todos os eventos

```
event_schema_version

```

Toda alteração

↓

Nova versão

Nunca alterar payload existente.

---

# Compatibilidade

SDK antigo

↓

Gateway

↓

Adapter

↓

Schema Atual

---

# Governança

Todo evento exige

owner

schema

payload

versão

documentação

teste

dashboard

alerta

---

# Segurança

Analytics nunca registra

Senha

Token

CPF completo

Cartão

PIX

Dados sensíveis

---

LGPD

Dados pessoais

↓

Hash

↓

Anonimização

---

# Qualidade

Analytics Health Score

↓

Persist Ratio

↓

DLQ

↓

Latency

↓

Availability

↓

Schema Compliance

---

# Integrações

OpenTelemetry

↓

Product Analytics

↓

Alert Engine

↓

Experiment Runtime

↓

Executive Dashboard

↓

Seller Dashboard

↓

Buyer Dashboard

↓

Search Dashboard

---

# Escalabilidade

Camadas independentes

```
SDK

Gateway

Registry

Storage

Runtime

Dashboards

Alerts

Experiments
```

Podem escalar separadamente.

---

# Roadmap

## Beta 2

- Runtime Architecture
- Registry
- Event Validation
- Runtime APIs
- Dashboards
- Product Health
- North Star
- Funnels
- Cohorts
- Alerts
- Experiments

---

## Beta 3

- Streaming Runtime
- Kafka
- Event Replay
- Session Replay
- Heatmaps
- ML Predictions
- Forecasting
- Auto Insights
- Auto Segmentation
- Auto Cohorts
- AI Analytics Assistant

---

# Relação com os documentos

Esta arquitetura implementa e integra:

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

Todos esses documentos representam módulos especializados do Analytics Runtime.

---

# Resumo

O **Analytics Runtime** é a camada estratégica de inteligência do Judge TCG Marketplace. Sua arquitetura foi projetada para garantir observabilidade completa do comportamento do produto, rastreabilidade dos eventos, governança dos dados e suporte à tomada de decisão baseada em métricas confiáveis.

Ele conecta Product Analytics, métricas de negócio, experimentação, dashboards executivos e mecanismos de alerta em uma plataforma unificada, preparada para evoluir do Public Beta até uma arquitetura orientada a eventos em tempo real com capacidades de IA e análise preditiva.
---

## Beta 2 Implementation Note

Runtime implementado em `services/api/app/analytics_runtime/`.

- Materializa Data Marts; dashboards internos via `GET /runtime/*`.
- Metric Engine: `registry/metrics.py` (validate_registry).
- Relatório: `docs/product/BETA2_RUNTIME_REPORT.md` · `context/beta2-product-analytics-runtime.md`.
