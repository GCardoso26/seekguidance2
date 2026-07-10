 # context/11-release/telemetry.md

# Telemetry Strategy

**Version:** 1.0  
**Status:** Active  
**Owner:** Platform Engineering  
**Context:** Platform Telemetry

---

# Objetivo

Este documento define a estratégia oficial de **Telemetry** do JudgeTCG.

A Telemetry é responsável por capturar, enriquecer, transportar e disponibilizar todos os sinais produzidos pela plataforma, permitindo que métricas, logs, traces e eventos de negócio sejam consumidos por sistemas de observabilidade, monitoramento, auditoria e inteligência operacional.

Enquanto **Observability** define *o que observar* e **Monitoring** define *o que acompanhar*, **Telemetry** define *como os dados são produzidos, enriquecidos e enviados*.

---

# Objetivos

A Telemetry deve garantir:

- instrumentação padronizada
- baixo overhead
- alta confiabilidade
- rastreabilidade ponta a ponta
- isolamento entre tenants
- compatibilidade com OpenTelemetry
- enriquecimento automático de contexto

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

┌────────────┬─────────────┬─────────────┐
│ Metrics    │ Logs        │ Traces      │
└────────────┴─────────────┴─────────────┘

↓

Storage

↓

Dashboards / Alerts / Analytics
```

---

# Fluxo de Telemetria

```text
Request

↓

Middleware

↓

Context Enrichment

↓

Telemetry SDK

↓

OpenTelemetry Collector

↓

Prometheus
Loki
Tempo

↓

Grafana
```

---

# Camadas Instrumentadas

Toda camada deve produzir telemetria.

```
Frontend

↓

BFF

↓

Application Services

↓

Domain

↓

Repositories

↓

Workers

↓

Queues

↓

Database

↓

Infraestrutura
```

---

# Instrumentação Obrigatória

Todos os serviços devem emitir:

- métricas
- logs
- traces
- eventos
- health
- version

---

# Contexto Global

Toda telemetria deve carregar automaticamente:

```
environment

application

service

version

tenant_id

store_id

user_id

request_id

trace_id

span_id

correlation_id
```

Esses campos nunca devem ser adicionados manualmente.

---

# Resource Attributes

Cada serviço registra atributos permanentes.

Exemplo:

```yaml
service.name: marketplace-api

service.version: 1.3.0

deployment.environment: production

region: sa-east-1
```

---

# Métricas

## HTTP

Capturar:

- requests
- latency
- throughput
- status code
- payload size

---

## Database

Capturar:

- query duration
- connection pool
- slow queries
- deadlocks

---

## Redis

Capturar:

- cache hit
- cache miss
- memory
- latency

---

## Queue

Capturar:

- active jobs
- pending jobs
- retries
- dead letters

---

## Storage

Capturar:

- uploads
- downloads
- image generation
- storage consumption

---

## Marketplace

Capturar:

- pedidos
- checkout
- pagamentos
- chargebacks
- repasses

---

## Seller

Capturar:

- anúncios
- bulk actions
- dashboard
- AI
- command center

---

## Buyer

Capturar:

- carrinhos
- wishlist
- compras
- buscas
- deck shopping

---

## Catálogo

Capturar:

- pesquisas
- visualizações
- imagens
- cartas
- expansões

---

## Judge

Capturar:

- consultas
- documentos
- rulings
- fontes utilizadas

---

## IA

Capturar:

- provider
- modelo
- prompt version
- tokens
- cache hit
- custo
- tempo
- recomendações

---

# Logs Estruturados

Formato JSON obrigatório.

Exemplo:

```json
{
  "timestamp":"2026-07-08T15:00:00Z",
  "service":"seller-api",
  "environment":"production",
  "trace_id":"abc123",
  "correlation_id":"xyz456",
  "tenant_id":"tenant-001",
  "store_id":"store-123",
  "level":"INFO",
  "message":"Listing published"
}
```

---

# Tracing Distribuído

Cada request gera:

```
Root Span

↓

Application Span

↓

Repository Span

↓

Database Span

↓

Queue Span
```

Todo fluxo é reconstruível.

---

# Eventos de Negócio

Além das métricas técnicas, eventos de domínio são emitidos.

Exemplos:

```
ListingPublished

OrderCreated

OrderCompleted

PaymentCaptured

SettlementReleased

ChargebackOpened

ReviewCreated

SellerAiBriefGenerated

CatalogViewed

SearchExecuted
```

---

# Enriquecimento Automático

A Telemetry adiciona automaticamente:

- IP (mascarado)
- país
- navegador
- dispositivo
- idioma
- plano do usuário
- tenant
- store

Sem necessidade de código da aplicação.

---

# Cardinalidade

Evitar alta cardinalidade.

Exemplo correto:

```
status

provider

game

tenant

environment
```

Evitar:

```
email

cpf

nome

query completa

prompt completo
```

---

# Sampling

Nem todo trace precisa ser armazenado.

Política:

| Tipo | Sampling |
|--------|----------|
| Errors | 100% |
| Payments | 100% |
| Checkout | 100% |
| AI | 100% |
| Marketplace | 25% |
| Catálogo | 10% |
| Busca | 5% |

---

# Retenção

| Tipo | Retenção |
|--------|----------|
| Metrics | 90 dias |
| Logs | 30 dias |
| Traces | 14 dias |
| Auditoria | 2 anos |
| Eventos Financeiros | 5 anos |

---

# Privacy

A Telemetry nunca deve registrar:

- senha
- token
- cartão
- PIX
- CVV
- cookies de autenticação
- prompts contendo dados sensíveis

Dados pessoais devem ser mascarados.

---

# Telemetria de IA

Toda interação com IA gera:

```text
provider

model

prompt_version

tokens_input

tokens_output

latency

estimated_cost

actual_cost

cache_hit

guardrail_result

evaluation_score
```

---

# Frontend Telemetry

Capturar:

- navegação
- tempo de carregamento
- Web Vitals
- erros JavaScript
- cliques críticos
- abandono de fluxo

---

# Business Telemetry

Eventos utilizados para Analytics.

## Marketplace

- compra
- venda
- pagamento
- cancelamento

---

## Seller

- anúncio
- edição
- bulk
- IA

---

## Buyer

- wishlist
- carrinho
- checkout
- coleção

---

## Catálogo

- carta aberta
- filtro aplicado
- expansão
- idioma

---

# KPIs

## Plataforma

- Availability
- Latency
- Throughput

---

## Marketplace

- GMV
- Conversão
- Receita

---

## Seller

- Tempo para publicar
- Produtos vendidos

---

## IA

- Tokens
- Custos
- Aceitação

---

# OpenTelemetry

A implementação oficial utiliza:

- Metrics API
- Logs API
- Trace API
- Context API
- Resource API

Toda instrumentação deve ser compatível.

---

# Exporters

Exportação padrão:

```
OTLP

↓

Collector

↓

Prometheus

↓

Loki

↓

Tempo

↓

Grafana
```

---

# Performance

A Telemetry não deve degradar a aplicação.

Meta:

- overhead inferior a 2%
- processamento assíncrono
- batching automático
- compressão
- retry

---

# Falhas

Caso o Collector esteja indisponível:

```
Application

↓

Buffer

↓

Retry

↓

Drop (último recurso)
```

A aplicação nunca deve falhar por causa da telemetria.

---

# Testes

Toda nova instrumentação deve possuir:

- testes unitários
- testes de integração
- validação dos atributos
- validação dos exporters

---

# Anti-patterns

Nunca:

❌ Criar logs sem contexto

❌ Registrar dados pessoais

❌ Enviar prompts completos

❌ Criar métricas de alta cardinalidade

❌ Bloquear requisições aguardando exporters

❌ Instrumentação duplicada

❌ Ignorar traces de pagamentos

---

# ADRs

## ADR-001

OpenTelemetry é o padrão oficial.

---

## ADR-002

Toda aplicação deve produzir métricas, logs e traces.

---

## ADR-003

Eventos de domínio fazem parte da telemetria.

---

## ADR-004

A Telemetry nunca bloqueia a execução da aplicação.

---

## ADR-005

Todos os sinais devem possuir correlation_id e trace_id.

---

## ADR-006

A instrumentação é responsabilidade da plataforma, não das features.

---

## ADR-007

Dados sensíveis são mascarados antes da exportação.

---

## ADR-008

Toda release deve validar a integridade da telemetria.

---

# Roadmap

## Atual

- OpenTelemetry
- OTLP
- Prometheus
- Loki
- Tempo
- Grafana
- Telemetria de IA
- Eventos de negócio

## Futuro

- Adaptive Sampling
- eBPF Telemetry
- AI-assisted Root Cause Analysis
- Edge Telemetry
- Real User Monitoring
- Continuous Profiling
- Telemetry Lakehouse
- Cost-aware Sampling
- Cross-Tenant Analytics (anonimizados)

---

# Estrutura Recomendada

```text
context/
└── 11-release/
    ├── telemetry.md
    ├── metrics/
    ├── traces/
    ├── logs/
    ├── exporters/
    ├── schemas/
    ├── events/
    └── collectors/
```

---

# Integração com a Arquitetura

```text
Frontend
     │
Backend APIs
     │
Application Services
     │
Repositories
     │
Workers
     │
Telemetry SDK
     │
OpenTelemetry Collector
     │
 ┌──────────┬──────────┬──────────┐
 │Metrics   │Logs      │Traces    │
 └──────────┴──────────┴──────────┘
     │
Grafana / Prometheus / Loki / Tempo
```

---

# Conclusão

A estratégia de Telemetry do JudgeTCG estabelece um padrão único para captura e transporte de sinais operacionais e de negócio em toda a plataforma.

Ao adotar OpenTelemetry como base, enriquecimento automático de contexto, eventos de domínio, telemetria específica para IA e políticas de privacidade e desempenho, a plataforma garante dados consistentes para observabilidade, monitoramento, auditoria e tomada de decisão, mantendo baixo impacto operacional e alta escalabilidade.