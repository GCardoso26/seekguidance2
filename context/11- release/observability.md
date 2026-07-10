 # context/11-release/observability.md

# Observability Strategy

**Version:** 1.0  
**Status:** Active  
**Owner:** Platform Engineering  
**Context:** Platform Observability

---

# Objetivo

Este documento define a estratégia oficial de **Observability** do JudgeTCG.

Observabilidade é um dos pilares arquiteturais da plataforma e garante que qualquer comportamento do sistema possa ser compreendido a partir de métricas, logs, traces e eventos, permitindo diagnóstico rápido, operação confiável e evolução contínua.

No JudgeTCG, observabilidade não serve apenas para detectar falhas, mas também para medir o comportamento do negócio.

---

# Princípios

Toda funcionalidade desenvolvida deve ser:

- Observável
- Auditável
- Mensurável
- Correlacionável
- Reproduzível

Sem telemetria não existe produção.

---

# Pilares

A estratégia segue os três pilares clássicos da observabilidade, complementados por eventos de domínio.

```text
Metrics

↓

Logs

↓

Distributed Tracing

↓

Business Events
```

---

# Arquitetura

```mermaid
flowchart TD

Application

↓

Telemetry SDK

↓

OpenTelemetry

↓

Collector

↓

┌─────────────┬──────────────┬───────────────┐
│ Metrics     │ Logs         │ Traces        │
└─────────────┴──────────────┴───────────────┘

↓

Dashboards

↓

Alerts
```

---

# Stack Recomendada

| Camada | Tecnologia |
|----------|------------|
| Instrumentação | OpenTelemetry |
| Logs | Loki |
| Métricas | Prometheus |
| Dashboards | Grafana |
| Tracing | Tempo ou Jaeger |
| Alertas | Alertmanager |
| Error Tracking | Sentry |

Toda a stack deve permanecer desacoplada da aplicação.

---

# Instrumentação

Todos os serviços devem emitir automaticamente:

- métricas
- logs
- traces
- correlation id
- eventos

Sem necessidade de código repetitivo.

---

# Correlation ID

Toda requisição recebe um identificador único.

Fluxo:

```text
Client

↓

API Gateway

↓

BFF

↓

Application

↓

Database

↓

Queue

↓

Worker
```

O mesmo **correlation_id** acompanha toda a execução.

---

# Trace ID

Cada operação distribuída possui:

```
trace_id

span_id

parent_span

correlation_id
```

Permitindo reconstruir todo o fluxo da requisição.

---

# Logs

Todos os logs devem ser estruturados em JSON.

Exemplo:

```json
{
  "timestamp":"2026-07-08T10:00:00Z",
  "level":"INFO",
  "service":"catalog-api",
  "trace_id":"...",
  "correlation_id":"...",
  "tenant_id":"...",
  "user_id":"...",
  "message":"Card loaded successfully"
}
```

Nunca utilizar logs textuais em produção.

---

# Níveis de Log

| Nível | Uso |
|--------|-----|
| TRACE | Debug detalhado |
| DEBUG | Desenvolvimento |
| INFO | Fluxos normais |
| WARN | Situações inesperadas |
| ERROR | Falhas recuperáveis |
| FATAL | Indisponibilidade |

---

# Campos Obrigatórios

Todo log deve conter:

```
timestamp

service

environment

version

trace_id

correlation_id

tenant_id

store_id

user_id

request_id

severity
```

---

# Métricas

Toda aplicação publica automaticamente:

## HTTP

- Requests
- Latência
- Throughput
- Status Codes

---

## Banco

- Queries
- Tempo médio
- Slow Queries
- Connections

---

## Redis

- Cache Hits
- Cache Misses
- TTL
- Memory Usage

---

## Queue

- Jobs Processados
- Retry
- Dead Letter Queue
- Tempo de fila

---

## IA

- Tokens
- Latência
- Custo
- Provider
- Modelo
- Cache Hit

---

## Marketplace

- Pedidos
- Carrinhos
- Conversão
- Checkout

---

## Catálogo

- Buscas
- Cartas visualizadas
- Cache
- Imagens

---

## Seller

- Publicações
- Alterações
- Bulk Actions
- IA

---

## Buyer

- Wishlist
- Deck Shopping
- Compras
- Smart Cart

---

# Tracing

Cada request gera spans.

Exemplo:

```text
GET /catalog/cards/123

↓

Authentication

↓

Application Service

↓

Read Model

↓

Redis

↓

PostgreSQL

↓

Response
```

Todo passo possui tempo medido.

---

# Eventos de Domínio

Além das métricas técnicas, o sistema registra eventos de negócio.

Exemplos:

```
OrderCreated

↓

PaymentCaptured

↓

ListingPublished

↓

ReviewCreated

↓

ReputationUpdated

↓

ChargebackOpened

↓

SellerAiBriefGenerated
```

---

# Dashboards

## Plataforma

- Uptime
- Requests
- Error Rate
- Latência

---

## Marketplace

- Pedidos
- Conversão
- Receita
- Ticket Médio

---

## Seller

- Produtos
- Operação
- IA
- Reputação

---

## Buyer

- Carrinho
- Wishlist
- Conversão

---

## IA

- Tokens
- Custos
- Provider
- Latência
- Cache

---

## Catálogo

- Busca
- Visualizações
- Imagens
- Popularidade

---

# Health Checks

Cada serviço deve expor:

```
/health

/ready

/live

/version
```

---

## Health

Verifica:

- Banco
- Redis
- Queue
- Storage
- APIs externas

---

## Readiness

Confirma que o serviço está apto para receber tráfego.

---

## Liveness

Confirma que o processo continua vivo.

---

# Alertas

Alertas automáticos.

## Infraestrutura

- CPU
- Memória
- Disco
- Rede

---

## Aplicação

- Error Rate
- Latência
- Timeouts
- Exceptions

---

## Banco

- Locks
- Slow Queries
- Deadlocks

---

## Marketplace

- Checkout
- Pagamentos
- Pedidos

---

## IA

- Custos
- Tokens
- Falhas
- Prompt Injection

---

# SLOs

| Indicador | Meta |
|-----------|------|
| Disponibilidade | 99.9% |
| API P95 | <300ms |
| Search | <500ms |
| Dashboard | <2s |
| Catálogo | <800ms |
| IA | <5s |

---

# SLIs

Medições utilizadas:

- disponibilidade
- tempo de resposta
- erro por minuto
- throughput
- cache hit
- fila
- consumo de recursos

---

# Error Budget

Cada serviço possui um orçamento de falhas.

Quando excedido:

- congelar novas features
- priorizar estabilidade
- reduzir risco operacional

---

# Auditoria

Toda ação crítica gera eventos auditáveis.

Exemplos:

- Login
- Permissões
- Alteração de preço
- Exclusão
- Pagamento
- Chargeback
- Bulk Action
- Seller AI Action

---

# LGPD

Logs nunca devem armazenar:

- senha
- token
- cartão
- PIX completo
- CPF em texto puro
- dados entre tenants

Dados sensíveis devem ser mascarados.

---

# Integração com IA

Toda chamada de IA registra:

```
provider

model

prompt_version

tokens

latency

estimated_cost

actual_cost

cache_hit

recommendations

guardrails

evaluation_score
```

---

# KPIs

## Técnicos

- Error Rate
- Availability
- P95
- Cache Hit
- Queue Size

---

## Negócio

- Conversão
- Receita
- Pedidos
- Publicações
- Tempo de Checkout

---

## IA

- Tokens
- Custo
- Briefs
- Recomendações
- Aceitação

---

# Testabilidade

Toda instrumentação deve possuir:

- testes unitários
- testes de integração
- validação dos dashboards
- validação de traces
- validação de logs

---

# Anti-patterns

Nunca:

❌ Utilizar logs sem contexto

❌ Não gerar correlation_id

❌ Logs em texto puro

❌ Não instrumentar novas funcionalidades

❌ Dashboards sem métricas de negócio

❌ Misturar logs de tenants

❌ Não monitorar filas

❌ Não medir IA

---

# ADRs

## ADR-001

Toda funcionalidade deve ser observável.

---

## ADR-002

OpenTelemetry é o padrão oficial.

---

## ADR-003

Correlation ID acompanha toda a requisição.

---

## ADR-004

Eventos de domínio fazem parte da observabilidade.

---

## ADR-005

Dashboards devem conter métricas técnicas e de negócio.

---

## ADR-006

Toda chamada de IA deve ser instrumentada.

---

## ADR-007

Logs estruturados são obrigatórios.

---

## ADR-008

Observabilidade é requisito para promoção de release.

---

# Roadmap

## Atual

- OpenTelemetry
- Prometheus
- Grafana
- Loki
- Tempo
- Sentry
- Dashboards operacionais

## Futuro

- Real User Monitoring (RUM)
- Session Replay
- Synthetic Monitoring
- AI Observability
- Business Health Score
- Auto Root Cause Analysis
- Predictive Alerting
- Anomaly Detection
- FinOps Dashboard
- Self-Healing Observability

---

# Estrutura Recomendada

```text
context/
└── 11-release/
    ├── observability.md
    ├── dashboards/
    ├── alerts/
    ├── traces/
    ├── metrics/
    ├── logs/
    ├── telemetry/
    └── runbooks/
```

---

# Integração com a Arquitetura

```text
Client
   │
   ▼
API Gateway
   │
   ▼
Application Services
   │
   ├──────── Metrics
   ├──────── Logs
   ├──────── Traces
   └──────── Domain Events
              │
              ▼
     OpenTelemetry Collector
              │
              ▼
 Prometheus / Loki / Tempo
              │
              ▼
         Grafana
              │
              ▼
     Dashboards & Alerts
```

---

# Conclusão

A estratégia de Observability do JudgeTCG garante que toda a plataforma seja transparente, mensurável e operacionalmente segura.

Ao unificar métricas técnicas, eventos de domínio, tracing distribuído, logs estruturados e monitoramento contínuo, a equipe consegue identificar rapidamente problemas, medir impacto no negócio e evoluir a plataforma com confiança. A observabilidade deixa de ser apenas uma ferramenta de suporte e passa a ser parte integrante da arquitetura da plataforma.