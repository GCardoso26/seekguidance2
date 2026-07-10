 # context/10-ai/observability.md

# AI Observability

**Version:** 1.0  
**Status:** Active  
**Owner:** AI Platform Team  
**Context:** Artificial Intelligence Platform

---

# Objetivo

Este documento define a arquitetura oficial de **Observabilidade da Plataforma de IA** do JudgeTCG.

A observabilidade permite compreender, medir, auditar e otimizar todo o ciclo de vida das interações entre usuários, Copilots, Context Providers, Tools e LLM Providers.

Ela é um componente transversal da arquitetura.

Não pertence ao Provider.

Não pertence ao Prompt.

Ela pertence à plataforma.

---

# Filosofia

A IA deve ser tratada como qualquer outro sistema crítico.

Toda execução deve responder:

- O que aconteceu?
- Quem executou?
- Qual contexto foi utilizado?
- Quais ferramentas foram chamadas?
- Quanto custou?
- Quanto tempo levou?
- O resultado foi útil?
- Podemos reproduzir a execução?

Nenhuma resposta da IA deve ser uma "caixa-preta".

---

# Objetivos

A observabilidade deve permitir:

- auditoria completa
- rastreamento distribuído
- métricas de negócio
- métricas técnicas
- otimização de custos
- detecção de falhas
- análise de qualidade
- reprodução de cenários

---

# Arquitetura

```mermaid
flowchart TD

User

↓

Copilot

↓

AI Pipeline

↓

Observability Layer

↓

Logs

Metrics

Traces

Events

↓

Dashboards

↓

Alerts
```

---

# Componentes

A camada de observabilidade possui cinco pilares.

```
Logs

Metrics

Traces

Events

Analytics
```

Cada um possui responsabilidades específicas.

---

# Fluxo

```mermaid
flowchart LR

Request

↓

Context

↓

Prompt Builder

↓

Provider

↓

Tools

↓

Response

↓

Telemetry

↓

Storage
```

Toda etapa gera telemetria.

---

# Correlation ID

Toda execução recebe um identificador único.

```
correlation_id

↓

CTX-01F...

↓

Propagado

↓

Todas as camadas
```

Incluindo:

- APIs
- Jobs
- Events
- Outbox
- Tool Calls
- Providers

---

# Trace ID

Além do Correlation ID existe um Trace ID.

```
HTTP

↓

Copilot

↓

Tools

↓

LLM

↓

Application Services
```

Permite visualizar a execução completa.

---

# Span Model

Cada operação gera um Span.

Exemplo

```
Request

↓

Load Context

↓

Recommendation Engine

↓

Prompt Builder

↓

LLM

↓

Response Validation

↓

Return
```

---

# Logs

Logs devem ser estruturados.

Formato:

```json
{
  "timestamp": "...",
  "correlation_id": "...",
  "copilot": "seller",
  "provider": "openai",
  "model": "gpt-5.5",
  "latency_ms": 932
}
```

Nunca utilizar logs textuais sem estrutura.

---

# Log Categories

Categorias oficiais.

```
REQUEST

RESPONSE

TOOL

PROMPT

MEMORY

PROVIDER

SECURITY

ERROR

COST

PERFORMANCE
```

---

# Eventos Observáveis

Eventos da IA.

```
PromptBuilt

PromptSent

ProviderStarted

ProviderCompleted

ToolExecuted

MemoryLoaded

RecommendationGenerated

ResponseValidated

FallbackActivated
```

Todos são publicados via Event Bus.

---

# Métricas Técnicas

Principais métricas.

```
Latency

↓

Prompt Build Time

↓

LLM Response Time

↓

Tool Execution Time

↓

Context Load Time

↓

Memory Load Time
```

---

# Métricas de Negócio

```
Briefs Gerados

↓

Insights Aceitos

↓

Prepared Actions

↓

Actions Executadas

↓

Conversão

↓

Economia Gerada
```

---

# Métricas de IA

```
Prompt Success

↓

Fallback Rate

↓

Hallucination Rate

↓

Tool Usage

↓

Recommendation Accuracy

↓

Acceptance Rate
```

---

# Métricas por Provider

Para cada Provider.

```
Requests

Latency

Errors

Timeouts

Tokens

Cost

Streaming Time

Fallbacks
```

---

# Métricas por Copilot

```
Seller

Buyer

Judge

Catalog

Admin
```

Cada Copilot possui dashboards próprios.

---

# Métricas por Tenant

Cada tenant acompanha.

```
Requests

↓

Custos

↓

Modelos

↓

Uso

↓

Insights

↓

Satisfação
```

Nunca compartilhar dados entre tenants.

---

# Tool Telemetry

Toda ferramenta registra.

```
tool_name

tool_version

duration

success

failure

retry

payload_size

result_size
```

---

# Context Providers

Registrar:

```
provider

latency

cache_hit

cache_miss

records_loaded

errors
```

---

# Recommendation Engine

Registrar:

```
rules_executed

recommendations

confidence

priority

impact

execution_time
```

---

# Prompt Builder

Registrar:

```
prompt_id

version

tokens

context_size

variables

template

build_time
```

---

# Memory

Registrar:

```
hits

misses

compression

retrieval_time

ttl

entries_loaded
```

---

# Response Validator

Registrar:

```
validation_time

policy_result

hallucination_score

citations

guardrails_triggered
```

---

# Tokens

Métricas obrigatórias.

```
Input Tokens

↓

Output Tokens

↓

Cached Tokens

↓

Total Tokens
```

---

# Custos

Registrar.

```
Estimated Cost

↓

Actual Cost

↓

Provider

↓

Tenant

↓

Copilot
```

---

# Dashboards

Dashboards oficiais.

## AI Overview

- Requests
- Latência
- Custos
- Providers
- Tokens

---

## Seller AI

- Briefs
- Recomendações
- Prepared Actions
- Acceptance Rate

---

## Buyer AI

- Sugestões
- Compras assistidas
- Wishlists
- Conversão

---

## Judge AI

- Consultas
- Fontes utilizadas
- Tempo médio
- Documentos mais acessados

---

## Providers

- Latência
- Erros
- Throughput
- Custos

---

## Tools

- Uso
- Tempo
- Falhas
- Retries

---

# Alertas

Alertas automáticos.

```
Latency > 5s

↓

High Cost

↓

Fallback Spike

↓

Hallucination Spike

↓

Provider Offline

↓

Memory Failure

↓

Tool Timeout
```

---

# SLA

Metas oficiais.

| Métrica | Meta |
|----------|------|
| Prompt Build | < 30 ms |
| Context Load | < 80 ms |
| Tool Execution | < 500 ms |
| LLM Response | < 3 s |
| End-to-End | < 4 s |

---

# SLO

Disponibilidade.

```
99.9%

↓

AI Platform
```

---

# Error Classification

```
Provider

↓

Tool

↓

Prompt

↓

Memory

↓

Context

↓

Policy

↓

Network
```

Cada erro possui código padronizado.

---

# Analytics

A plataforma registra.

```
Perguntas

↓

Categorias

↓

Resultados

↓

Feedback

↓

Conversão

↓

Uso por Copilot
```

---

# OpenTelemetry

A implementação deve ser compatível com OpenTelemetry.

Instrumentação mínima:

- HTTP
- Background Jobs
- Providers
- Context Providers
- Tool Calls
- Event Bus
- PostgreSQL
- Redis
- Vector Store

---

# Integrações

Compatível com:

- OpenTelemetry
- Prometheus
- Grafana
- Jaeger
- Tempo
- Loki
- Sentry
- Azure Monitor
- Datadog
- New Relic

A arquitetura não depende de um fornecedor específico.

---

# Segurança

Nunca registrar:

- prompts completos em produção (apenas hash ou versão, salvo ambiente de desenvolvimento autorizado);
- dados pessoais sensíveis;
- tokens de autenticação;
- API Keys;
- cartões;
- credenciais;
- payloads confidenciais.

Logs devem respeitar LGPD e políticas de retenção.

---

# Retenção

| Tipo | Retenção |
|--------|-----------|
| Traces | 7 dias |
| Logs | 30 dias |
| Métricas agregadas | 13 meses |
| Custos | Permanente |
| Eventos de auditoria | Permanente |
| Alertas | 90 dias |

---

# Testabilidade

Toda instrumentação deve possuir:

- testes unitários
- testes de integração
- validação de métricas
- validação de traces
- validação de logs estruturados

---

# Anti-patterns

Nunca:

❌ Logar prompts completos em produção

❌ Logar respostas completas do usuário

❌ Misturar métricas de tenants

❌ Métricas sem Correlation ID

❌ Logs textuais sem estrutura

❌ Dependência de um único fornecedor

❌ Métricas calculadas apenas no frontend

---

# ADRs

## ADR-001

Toda execução gera Correlation ID.

---

## ADR-002

OpenTelemetry é o padrão de instrumentação.

---

## ADR-003

Observabilidade é independente do Provider.

---

## ADR-004

Custo é métrica de primeira classe.

---

## ADR-005

Toda Tool gera métricas próprias.

---

## ADR-006

Recommendation Engine possui telemetria dedicada.

---

## ADR-007

Prompt Builder registra apenas metadados em produção.

---

## ADR-008

Todos os componentes da IA devem ser observáveis desde o primeiro dia (Observability by Design).

---

# Roadmap

## Atual

- Logs estruturados
- Métricas
- Traces
- Dashboards
- Custos
- Telemetria por Provider
- Telemetria por Copilot

## Futuro

- AI Quality Score
- Hallucination Detector
- Prompt Replay
- Cost Forecasting
- Live Token Dashboard
- Auto Root Cause Analysis
- Distributed AI Tracing
- AI Health Dashboard
- Intelligent Alert Correlation
- Observabilidade para agentes MCP

---

# Integração com a Arquitetura

```text
HTTP Request
      │
      ▼
Copilot
      │
      ▼
Context Providers
      │
      ▼
Recommendation Engine
      │
      ▼
Prompt Builder
      │
      ▼
LLM Provider
      │
      ▼
Response Validator
      │
      ▼
Telemetry Pipeline
      │
      ├──────── Logs
      ├──────── Metrics
      ├──────── Traces
      ├──────── Events
      └──────── Alerts
```

A camada de Observabilidade acompanha toda a execução da IA sem interferir na lógica de negócio.

---

# Conclusão

A observabilidade da plataforma de IA do JudgeTCG transforma cada interação em um fluxo totalmente rastreável, auditável e mensurável.

Com logs estruturados, métricas, traces distribuídos, eventos de domínio e integração nativa com OpenTelemetry, a plataforma consegue identificar gargalos, otimizar custos, medir qualidade e evoluir continuamente seus Copilots sem depender de inspeção manual ou comportamento específico de um Provider.

Essa abordagem estabelece o princípio de **Observability by Design**, garantindo que toda nova capacidade de IA já nasça monitorável, explicável e preparada para operação em escala.