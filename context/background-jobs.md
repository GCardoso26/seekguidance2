# Background Jobs Workflow

> Workflow ID: WF-013
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Platform Context
>
> Aggregate Root: Job
>
> Bounded Context: Platform
>
> Dependências:
>
> - cqrs-pattern.md
> - outbox-pattern.md (futuro)
> - inbox-pattern.md (futuro)
> - domain-event-contracts.md
> - transaction-boundaries.md
> - unit-of-work.md
> - notification.md
> - reputation.md
> - catalog-import.md
> - payment.md
> - order-lifecycle.md

---

# Objetivo

O Background Jobs Workflow define a arquitetura oficial para execução de tarefas assíncronas do JudgeTCG.

Nenhuma operação longa, distribuída ou dependente de serviços externos deve ser executada durante uma Transaction.

Toda execução assíncrona deve ocorrer através da plataforma de Background Jobs.

---

# Filosofia

Transaction

↓

Commit

↓

Outbox

↓

Event Bus

↓

Background Jobs

↓

Workers

↓

Eventos

↓

Projeções

---

# Objetivos

Garantir:

- baixo acoplamento;
- alta escalabilidade;
- idempotência;
- resiliência;
- observabilidade;
- processamento distribuído;
- retries seguros.

---

# Escopo

## Inclui

Workers.

Filas.

Retries.

Dead Letter Queue.

Backoff.

Scheduler.

Cron Jobs.

Processamento paralelo.

Observabilidade.

---

## Não inclui

Regras de negócio.

Transactions.

Consultas síncronas.

Endpoints HTTP.

---

# Tipos de Jobs

## Event Driven

Executados após Domain Events.

Exemplos:

OrderCompleted

↓

Notification

↓

Reputation

↓

Analytics

---

## Scheduled

Executados periodicamente.

Exemplos

Reconciliação.

Expiração.

Limpeza.

Rebuild.

---

## Manual

Executados por administradores.

Exemplos

Rebuild Search.

Reindex.

Reprocessamento.

---

## Batch

Grandes volumes.

Exemplos

Import.

Migração.

Sincronização.

---

# Atores

Workers

Scheduler

Administrador

Sistema

Marketplace

---

# Pré-condições

Evento persistido.

Transaction finalizada.

Outbox persistida.

---

# Gatilhos

Domain Events.

Cron.

Manual Trigger.

Retry.

Health Recovery.

---

# Entradas

JobType

Payload

CorrelationId

Priority

RetryCount

Version

---

# Saídas

Job executado.

Eventos publicados.

Logs.

Métricas.

Auditoria.

---

# Aggregate Principal

Job

Responsável por:

- estado;
- retries;
- prioridade;
- histórico;
- auditoria.

---

# Fluxo Principal

Evento publicado.

↓

Worker recebe.

↓

Criar Job.

↓

Persistir.

↓

Executar.

↓

Persistir resultado.

↓

Commit.

↓

Publicar novos eventos.

↓

Encerrar.

---

# Fluxos Alternativos

## Worker indisponível

Retry.

---

## Timeout

Retry.

---

## Falha permanente

Dead Letter Queue.

---

## Payload inválido

Cancelar.

↓

Registrar.

---

## Evento duplicado

Ignorar.

---

# State Machine

```text
Created

↓

Queued

↓

Running

↓

Completed
```

Estados alternativos

```text
Retrying

Failed

Cancelled

DeadLetter

Expired
```

Transições proibidas

Completed → Running

Cancelled → Running

DeadLetter → Running

---

# Prioridades

Critical

High

Normal

Low

Batch

Cada prioridade possui filas independentes.

---

# Workers Oficiais

## Notification Worker

Envia notificações.

---

## Reputation Worker

Recalcula Reputation.

---

## Settlement Worker

Executa liquidação financeira.

---

## Search Worker

Atualiza índice.

---

## Projection Worker

Atualiza Read Models.

---

## Pricing Worker

Recalcula preços.

---

## Catalog Import Worker

Importa coleções.

---

## Analytics Worker

Atualiza dashboards.

---

## Cleanup Worker

Remove dados temporários.

---

## Fraud Worker

Executa análise antifraude.

---

## Image Worker

Processa imagens.

---

## Sync Worker

Sincroniza provedores externos.

---

# Retry Strategy

Primeira tentativa

Imediata.

---

Retry 1

30 segundos.

---

Retry 2

2 minutos.

---

Retry 3

10 minutos.

---

Retry 4

30 minutos.

---

Retry 5

2 horas.

---

Após limite

Dead Letter Queue.

Backoff exponencial com jitter deve ser utilizado para evitar tempestades de requisições.

---

# Dead Letter Queue

Todo Job que exceder o limite de retries deve ser enviado para DLQ.

A DLQ permite:

Análise.

Reprocessamento.

Auditoria.

Alertas.

Nunca é descartada automaticamente.

---

# Idempotência

Todo Worker deve ser idempotente.

Obrigatório utilizar:

CorrelationId.

EventId.

AggregateVersion.

JobId.

Nenhum Worker pode executar duas vezes o mesmo efeito observável.

---

# Regras de Negócio

## BR-001

Nenhum Job executa durante Transaction.

---

## BR-002

Todo Job possui CorrelationId.

---

## BR-003

Todo Job é auditável.

---

## BR-004

Retries são automáticos.

---

## BR-005

Workers nunca compartilham estado em memória.

---

## BR-006

Todo Job deve ser idempotente.

---

## BR-007

Jobs podem ser distribuídos entre múltiplas instâncias.

---

## BR-008

Falhas não interrompem outras filas.

---

## BR-009

Eventos são processados na ordem garantida apenas quando exigido pelo domínio (por Aggregate ou Partition Key).

---

## BR-010

Toda fila deve possuir métricas.

---

# Permissões

Jobs.View

Jobs.Retry

Jobs.Cancel

Jobs.Reprocess

Jobs.Admin

---

# Domain Policies

RetryPolicy

QueuePolicy

PriorityPolicy

SchedulerPolicy

WorkerPolicy

---

# Domain Services

JobScheduler

RetryEngine

DeadLetterService

JobDispatcher

WorkerRegistry

HealthMonitor

---

# Eventos Emitidos

JobCreated

JobStarted

JobCompleted

JobRetryScheduled

JobFailed

JobCancelled

JobMovedToDeadLetter

---

# Eventos Consumidos

Todos os Domain Events elegíveis.

Cron Triggers.

Manual Triggers.

---

# Compensações

Worker falhou

↓

Retry.

---

Banco indisponível

↓

Retry.

---

Payload inválido

↓

DLQ.

---

Falha externa

↓

Retry com backoff.

---

# Background Processing

Reconciliação.

Cleanup.

Analytics.

Notifications.

Reputation.

Settlement.

Search.

Catalog.

Pricing.

Fraud.

---

# Integrações

Redis

Cloudflare Queues

Supabase

Event Bus

Scheduler

Object Storage

Analytics

---

# SLA

Critical

≤ 10 segundos

---

High

≤ 30 segundos

---

Normal

≤ 2 minutos

---

Batch

Conforme capacidade da fila.

---

# Auditoria

Registrar

JobId

Worker

PayloadHash

CorrelationId

RetryCount

ExecutionTime

Queue

Timestamp

Resultado

---

# Observabilidade

Queue Length

Worker Utilization

Latency

Retries

DLQ Size

Success Rate

Failure Rate

Processing Time

---

# KPIs

KPI-001

Tempo médio de execução.

---

KPI-002

Taxa de sucesso.

---

KPI-003

Retries por Worker.

---

KPI-004

DLQ.

---

KPI-005

Jobs por minuto.

---

KPI-006

Tempo médio em fila.

---

KPI-007

Throughput por Worker.

---

# Anti Patterns

É proibido

Executar HTTP dentro da Transaction.

Executar Jobs síncronos.

Compartilhar estado entre Workers.

Executar SQL direto.

Ignorar idempotência.

Ignorar CorrelationId.

Utilizar filas únicas para todos os domínios.

---

# Casos Extremos

Milhões de Jobs simultâneos.

Rebuild completo do catálogo.

Reindexação global.

Perda de conexão com broker.

Falha regional.

Recuperação após desastre.

Replay de eventos.

---

# Implementação Esperada

```text
Application Service

↓

Unit Of Work

↓

Commit

↓

Outbox

↓

Event Bus

↓

Job Dispatcher

↓

Worker Registry

↓

Worker Especializado

↓

Repository

↓

Persist

↓

Commit

↓

Novo Domain Event

↓

Outros Workers
```

---

# Dependências

cqrs-pattern.md

transaction-boundaries.md

unit-of-work.md

domain-event-contracts.md

catalog-import.md

notifications.md

reputation.md

---

# Evolução

Versões futuras poderão incluir:

- Auto Scaling de Workers.
- Priorização dinâmica baseada em SLA.
- Sharding por contexto.
- Event Replay Engine.
- Workflow Orchestrator.
- Distributed Scheduler.
- Kubernetes Jobs.
- Multi-região.
- Job Versioning.
- Job Sandbox.

---

# Relação com os Contexts

Cada Bounded Context publica eventos de domínio e permanece responsável apenas por suas regras transacionais.

A plataforma de Background Jobs consome esses eventos e executa tarefas assíncronas de forma desacoplada, permitindo que Notification, Search, Reputation, Settlement, Analytics e outros Contexts evoluam independentemente.

---

# Regra Fundamental

Toda operação assíncrona do JudgeTCG deve ser executada através da plataforma oficial de Background Jobs.

Workers especializados, filas independentes, idempotência, retries, Dead Letter Queue, observabilidade e processamento orientado a eventos garantem uma arquitetura resiliente, escalável e preparada para operar em larga escala.