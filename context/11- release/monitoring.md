 # context/11-release/monitoring.md

# Monitoring Strategy

**Version:** 1.0  
**Status:** Active  
**Owner:** Platform Engineering / SRE  
**Context:** Platform Monitoring

---

# Objetivo

Este documento define a estratégia oficial de **Monitoring** do JudgeTCG.

Enquanto **Observability** responde _"por que algo aconteceu?"_, o **Monitoring** responde _"algo está errado agora?"_.

O objetivo é detectar automaticamente falhas, degradações de performance, indisponibilidade e comportamentos anormais antes que impactem os usuários.

O sistema deve ser capaz de monitorar infraestrutura, aplicações, banco de dados, marketplace, catálogo, IA e regras de negócio.

---

# Filosofia

O melhor incidente é aquele percebido pela equipe antes do usuário.

Toda funcionalidade crítica deve possuir:

- métricas
- alertas
- dashboards
- runbooks
- responsáveis

---

# Arquitetura

```mermaid
flowchart TD

Applications

↓

OpenTelemetry

↓

Prometheus

↓

Alert Manager

↓

Grafana

↓

Slack / Discord / Email / PagerDuty
```

---

# Camadas Monitoradas

```
Infraestrutura

↓

Containers

↓

Banco de Dados

↓

Redis

↓

Queues

↓

Backend APIs

↓

Frontend

↓

Marketplace

↓

IA

↓

Business Metrics
```

---

# Tipos de Monitoramento

O JudgeTCG monitora sete categorias.

| Categoria | Objetivo |
|------------|----------|
| Infrastructure | Saúde dos servidores |
| Platform | APIs e microsserviços |
| Database | PostgreSQL |
| Cache | Redis |
| AI | Copilots e Providers |
| Marketplace | Fluxos comerciais |
| Business | KPIs da plataforma |

---

# Infraestrutura

Monitorar continuamente:

- CPU
- Memória
- Disco
- Rede
- File System
- Containers
- Docker
- Kubernetes (quando aplicável)

---

## Alertas

| Indicador | Limite |
|------------|---------|
| CPU | >80% (5 min) |
| Memória | >85% |
| Disco | >90% |
| Load Average | >2x CPUs |
| Reinício de Container | Imediato |

---

# Backend

Monitorar:

- Requests por segundo
- Tempo médio
- Tempo P95
- Tempo P99
- Status HTTP
- Exceptions
- Timeouts

---

## Alertas

| Evento | Ação |
|----------|------|
| Error Rate > 3% | Warning |
| Error Rate > 5% | Critical |
| API indisponível | Critical |
| Timeout elevado | Warning |

---

# Banco de Dados

Monitorar:

- conexões
- locks
- deadlocks
- tempo das queries
- uso de índices
- replication lag
- tamanho das tabelas

---

## Alertas

```
Deadlock

↓

Critical

------------

Slow Query > 500ms

↓

Warning

------------

Conexões > 80%

↓

Warning
```

---

# Redis

Monitorar:

- hit ratio
- miss ratio
- memória
- TTL
- eviction
- latência

Meta:

```
Cache Hit

>

90%
```

---

# Queue

Monitorar:

- jobs ativos
- jobs pendentes
- retries
- dead letter queue
- workers

---

## Alertas

- fila parada
- backlog crescente
- retries excessivos
- DLQ acima do limite

---

# Marketplace

Monitorar:

- pedidos
- pagamentos
- chargebacks
- checkouts
- cancelamentos
- carrinhos

---

## Alertas

Exemplo

```
Checkout Conversion

↓

queda >20%

↓

Warning
```

---

# Seller Experience

Monitorar:

- Dashboard
- Command Center
- Publicações
- Bulk Actions
- Seller AI
- Inbox

---

Indicadores

- tempo do dashboard
- tempo do wizard
- tempo de publicação
- erro em bulk actions

---

# Buyer Experience

Monitorar:

- Carrinho
- Wishlist
- Deck Shopping
- Busca
- Checkout

---

# Catálogo

Monitorar:

- pesquisas
- imagens
- cartas
- expansões
- inteligência
- preço

---

## Alertas

- imagens indisponíveis
- sincronização interrompida
- preços desatualizados
- falha em importações

---

# IA

Monitorar:

- Provider
- Modelo
- Tokens
- Latência
- Custo
- Cache
- Prompt Failures
- Guardrails

---

## Alertas

| Evento | Limite |
|----------|---------|
| Latência >5s | Warning |
| Provider indisponível | Critical |
| Prompt Injection | Immediate |
| Custo diário | >90% orçamento |

---

# Search

Monitorar:

- tempo da busca
- providers
- cache
- resultados vazios
- erros

---

Meta

```
Busca

↓

<500ms
```

---

# Frontend

Monitorar:

- LCP
- CLS
- INP
- FCP
- TTFB
- JavaScript Errors

---

Ferramentas

- Lighthouse CI
- Web Vitals
- Sentry
- Grafana Faro (opcional)

---

# Business Monitoring

Monitorar indicadores do negócio.

## Marketplace

- Receita
- GMV
- Pedidos
- Ticket Médio

---

## Seller

- Publicações
- Conversão
- Tempo até venda

---

## Buyer

- Conversão
- Wishlist
- Compras

---

## IA

- Briefs
- Insights
- Recomendações
- Ações Preparadas

---

# Dashboards

## Executive

KPIs do negócio.

---

## Operations

Infraestrutura.

---

## Marketplace

Fluxos comerciais.

---

## Seller

Painel operacional.

---

## Buyer

Experiência de compra.

---

## AI

Copilots.

---

## Catalog

Catálogo global.

---

# Health Checks

Todos os serviços devem expor:

```
GET /health

GET /ready

GET /live

GET /version
```

---

# Heartbeats

Workers enviam heartbeat periódico.

Caso não haja heartbeat:

```
Worker Offline

↓

Critical
```

---

# Alert Routing

Alertas possuem níveis.

| Severidade | Destino |
|-------------|----------|
| Info | Dashboard |
| Warning | Slack |
| Error | Slack + Email |
| Critical | PagerDuty + SMS |

---

# Runbooks

Todo alerta deve possuir runbook.

Estrutura:

```
Problema

↓

Possíveis causas

↓

Diagnóstico

↓

Mitigação

↓

Rollback

↓

Escalonamento
```

---

# SLOs

| Serviço | Meta |
|----------|------|
| Marketplace | 99.9% |
| APIs | 99.95% |
| IA | 99.5% |
| Search | 99.9% |
| Catálogo | 99.9% |

---

# Error Budget

Quando excedido:

- congelar novas features
- priorizar estabilidade
- investigar causa
- revisar arquitetura

---

# Monitoramento Sintético

Executar continuamente:

- Login
- Busca
- Checkout
- Publicação
- Compra
- Consulta Judge

Mesmo sem usuários reais.

---

# Real User Monitoring

Monitorar:

- tempo percebido
- navegação
- erros JS
- abandono
- dispositivos
- navegadores

---

# Capacidade

Monitorar crescimento de:

- usuários
- pedidos
- catálogo
- imagens
- filas
- tokens IA
- armazenamento

Gerar previsões automáticas.

---

# KPIs

## Técnicos

- Availability
- Error Rate
- P95
- Cache Hit
- Queue Size

---

## Negócio

- GMV
- Conversão
- Pedidos
- Receita

---

## IA

- Tokens
- Custo
- Latência
- Recomendações

---

# Anti-patterns

Nunca:

❌ Monitorar apenas infraestrutura

❌ Não monitorar negócio

❌ Não possuir alertas

❌ Alertas sem responsáveis

❌ Dashboards sem contexto

❌ Não monitorar IA

❌ Não monitorar filas

---

# ADRs

## ADR-001

Todo serviço possui métricas obrigatórias.

---

## ADR-002

Todo alerta possui runbook.

---

## ADR-003

Business Metrics são monitoradas continuamente.

---

## ADR-004

Monitoramento sintético faz parte da operação.

---

## ADR-005

IA possui monitoramento independente.

---

## ADR-006

Todos os serviços expõem Health Checks.

---

## ADR-007

Alertas críticos exigem escalonamento automático.

---

## ADR-008

Monitoring e Observability são complementares, não substitutos.

---

# Roadmap

## Atual

- Prometheus
- Grafana
- Alertmanager
- OpenTelemetry
- Sentry
- Dashboards Operacionais

## Futuro

- AI Anomaly Detection
- Predictive Monitoring
- Capacity Forecasting
- Auto Scaling baseado em métricas
- Self-Healing Infrastructure
- Intelligent Alert Correlation
- Incident Timeline automática
- Monitoring as Code

---

# Estrutura Recomendada

```text
context/
└── 11-release/
    ├── monitoring.md
    ├── dashboards/
    ├── alerts/
    ├── runbooks/
    ├── synthetic/
    ├── rum/
    ├── slo/
    └── capacity/
```

---

# Integração com a Arquitetura

```text
Applications
      │
      ▼
OpenTelemetry
      │
      ▼
Prometheus
      │
      ▼
Alertmanager
      │
      ▼
Grafana Dashboards
      │
      ▼
Slack / PagerDuty / Email
      │
      ▼
Runbooks
      │
      ▼
Incident Response
```

---

# Conclusão

A estratégia de Monitoring do JudgeTCG garante que a plataforma seja monitorada de forma contínua, proativa e orientada ao negócio.

Ao integrar monitoramento de infraestrutura, aplicações, IA, marketplace, catálogo e indicadores comerciais, a equipe consegue detectar rapidamente qualquer degradação, responder com agilidade a incidentes e manter níveis elevados de disponibilidade, desempenho e confiabilidade durante todo o ciclo de vida da plataforma.
---

# Beta 1.5 — Analytics Ingest Monitoring

Alertas futuros (wire quando Grafana disponível):

| Sinal | Condição | Severidade |
|-------|----------|------------|
| lost rate | lost/received > 0 por 15m | P0 |
| DLQ unknown | unknown_event > 2% volume | P1 |
| DLQ depth | pending > 500 | P1 |
| Track availability | gateway/API failures | P0 |
| AHS | Analytics Health Score < 50 | P0 |

Fonte: `ingestion-health` + logs `analytics_*`.
