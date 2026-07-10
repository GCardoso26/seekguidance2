# Notifications Workflow

> Workflow ID: WF-011
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Notification Context
>
> Aggregate Root: Notification
>
> Bounded Context: Notification
>
> Dependências:
>
> - order-lifecycle.md
> - payment.md
> - fulfillment.md
> - refunds.md
> - disputes.md
> - moderation.md
> - reputation.md
> - business-rules.md
> - permission-matrix.md
> - cqrs-pattern.md
> - unit-of-work.md
> - domain-event-contracts.md

---

# Objetivo

O Notification Workflow é responsável por transformar eventos de domínio em comunicações enviadas aos usuários e sistemas externos.

O contexto de Notification nunca executa regras de negócio.

Ele apenas observa eventos publicados por outros Contexts, aplica preferências do destinatário, escolhe o canal apropriado e realiza a entrega.

---

# Filosofia

Evento acontece.

↓

Notification recebe.

↓

Validar preferências.

↓

Selecionar template.

↓

Selecionar canal.

↓

Enviar.

↓

Registrar resultado.

---

# Escopo

## Inclui

Notificações In-App.

Email.

Push.

SMS.

WhatsApp (futuro).

WebSocket.

Webhooks.

Digest diário.

Notificações internas.

Templates.

Preferências.

Retries.

Dead Letter Queue.

---

## Não inclui

Regras de negócio.

Alteração de Aggregates.

Autorização.

Permissões.

---

# Canais Suportados

## In-App

Centro de notificações.

Badge.

Timeline.

---

## Email

Transacional.

Marketing (futuro).

---

## Push

Android.

iOS.

Web Push.

---

## SMS

Mensagens críticas.

---

## WhatsApp (Futuro)

Notificações transacionais.

---

## WebSocket

Atualização em tempo real.

Dashboard.

Pedidos.

Painéis administrativos.

---

## Webhook

Integrações externas.

ERP.

CRM.

Parceiros.

---

# Atores

Buyer

Seller

Administrador

Sistema

Workers

Integrações externas

---

# Pré-condições

Evento publicado.

Usuário existente.

Preferências carregadas.

Canal disponível.

Template publicado.

---

# Gatilhos

Qualquer Domain Event elegível.

Exemplos:

PaymentApproved

OrderCreated

ShipmentPosted

ShipmentDelivered

RefundSucceeded

DisputeOpened

ModerationDecisionMade

StoreApproved

ReviewCreated

SettlementReleased (futuro)

---

# Entradas

EventId

EventType

RecipientId

Payload

CorrelationId

Locale

NotificationPriority

---

# Saídas

Notification criada.

Entrega realizada.

Eventos.

Logs.

Métricas.

---

# Aggregate Principal

Notification

Responsável por:

- ciclo de vida da notificação;
- estado da entrega;
- auditoria;
- idempotência;
- rastreabilidade.

---

# Fluxo Principal

Evento recebido.

↓

Resolver destinatários.

↓

Carregar preferências.

↓

Aplicar regras de opt-in.

↓

Selecionar template.

↓

Renderizar conteúdo.

↓

Selecionar canal.

↓

Persistir Notification.

↓

Commit.

↓

Enviar.

↓

Receber confirmação.

↓

Atualizar estado.

↓

Emitir NotificationDelivered.

---

# Fluxos Alternativos

## Usuário desativou canal

Selecionar próximo canal elegível.

---

## Template inexistente

Falha.

↓

Dead Letter.

---

## Gateway indisponível

Retry.

---

## Usuário inexistente

Descartar.

---

## Canal indisponível

Fallback.

---

# State Machine

```text
Created

↓

Queued

↓

Sending

↓

Delivered
```

Estados alternativos

```text
Read

Failed

Cancelled

Expired

DeadLetter
```

Transições proibidas

Delivered → Sending

Failed → Delivered

Cancelled → Sending

---

# Prioridades

Critical

High

Normal

Low

Bulk

Cada prioridade define:

- ordem da fila;
- SLA;
- número de retries;
- canais permitidos.

---

# Preferências do Usuário

Cada usuário possui configuração independente por:

Evento

Canal

Idioma

Horário

Silenciamento

Resumo diário

Opt-in

Opt-out

Essas preferências nunca alteram os eventos de domínio.

---

# Template Engine

Todo template deve possuir:

TemplateId

Versão

Idioma

Canal

Variáveis

Fallback

Template HTML

Template Texto

Template Push

Template SMS

Nenhum texto fica hardcoded no código.

---

# Channel Engine

Responsável por decidir:

Email

Push

SMS

WhatsApp

WebSocket

Webhook

A decisão é baseada em:

Preferências.

Prioridade.

Disponibilidade.

Políticas.

---

# Delivery Engine

Responsável por:

Envio.

Retries.

Backoff exponencial.

Dead Letter Queue.

Confirmação.

Métricas.

---

# Regras de Negócio

## BR-001

Notification nunca altera Aggregates.

---

## BR-002

Todo envio é idempotente.

---

## BR-003

Template deve possuir versão.

---

## BR-004

Preferências são respeitadas.

---

## BR-005

Eventos críticos ignoram opt-out de marketing.

---

## BR-006

Toda entrega possui auditoria.

---

## BR-007

Retries utilizam backoff exponencial.

---

## BR-008

Dead Letter Queue é obrigatória.

---

## BR-009

Canal secundário pode ser utilizado em caso de falha.

---

## BR-010

Notificações transacionais possuem prioridade superior às promocionais.

---

# Permissões

Notification.View

Notification.Send

Notification.TemplateManage

Notification.PreferenceManage

Notification.Admin

---

# Domain Policies

NotificationPolicy

PreferencePolicy

TemplatePolicy

ChannelPolicy

RetryPolicy

---

# Domain Services

NotificationEngine

TemplateEngine

PreferenceEngine

ChannelRouter

DeliveryEngine

RetryService

---

# Eventos Emitidos

NotificationCreated

NotificationQueued

NotificationSent

NotificationDelivered

NotificationRead

NotificationFailed

NotificationExpired

---

# Eventos Consumidos

Todos os Domain Events elegíveis.

---

# Compensações

Falha envio

↓

Retry.

---

Falha persistência

↓

Rollback.

---

Gateway indisponível

↓

Fila.

↓

Dead Letter.

---

# Background Processing

Retries.

Digest diário.

Expiração.

Limpeza.

Analytics.

Métricas.

Reenvio.

---

# Integrações

SMTP

Firebase Cloud Messaging

APNs

Twilio

WhatsApp Business API

Supabase Realtime

Redis

Cloudflare Queues

Event Bus

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

Bulk

Até 1 hora

---

# Auditoria

Registrar

NotificationId

Recipient

TemplateId

Canal

Status

RetryCount

CorrelationId

WorkflowId

Timestamp

---

# Observabilidade

Latency

DeliveryRate

RetryRate

FailureRate

DLQSize

TemplateRenderTime

QueueTime

---

# KPIs

KPI-001

Taxa de entrega.

---

KPI-002

Tempo médio de entrega.

---

KPI-003

Taxa de leitura.

---

KPI-004

Falhas por canal.

---

KPI-005

Tempo médio de renderização.

---

KPI-006

Notificações por evento.

---

KPI-007

Uso por canal.

---

# Anti Patterns

É proibido

Executar regras de negócio.

Consultar Aggregates durante envio.

Hardcode de mensagens.

Ignorar preferências.

Enviar duplicado.

Executar envio dentro da Transaction.

---

# Casos Extremos

Eventos duplicados.

Milhões de notificações simultâneas.

Gateway indisponível.

Template removido.

Usuário sem canais disponíveis.

Rebuild completo de notificações.

---

# Implementação Esperada

```text
Domain Event

↓

Notification Worker

↓

Preference Engine

↓

Template Engine

↓

Channel Router

↓

Notification Aggregate

↓

Repository

↓

Unit Of Work

↓

Persist

↓

Commit

↓

Delivery Engine

↓

Provider

↓

Delivery Callback

↓

Notification Aggregate

↓

Commit

↓

NotificationDelivered
```

---

# Dependências

order-lifecycle.md

payment.md

fulfillment.md

refunds.md

disputes.md

moderation.md

reputation.md

business-rules.md

permission-matrix.md

---

# Evolução

Versões futuras poderão incluir:

- IA para personalização de mensagens.
- Tradução automática.
- Resumos inteligentes.
- Preferências por contexto.
- Notificações geolocalizadas.
- Discord.
- Telegram.
- Microsoft Teams.
- Slack.
- Campanhas automatizadas.
- Orquestração omnichannel.

---

# Relação com Outros Contexts

O Notification Context atua exclusivamente como consumidor de eventos.

Nenhum contexto pode solicitar diretamente alterações de estado em Notification.

Toda comunicação deve ocorrer por meio de Domain Events ou APIs específicas de envio administrativo.

---

# Regra Fundamental

O Notification Workflow transforma eventos de domínio em comunicações confiáveis, auditáveis e escaláveis.

Ele permanece completamente desacoplado das regras de negócio, respeitando preferências dos usuários, utilizando templates versionados, roteamento inteligente de canais e mecanismos robustos de entrega, retry e observabilidade, garantindo que a comunicação da plataforma evolua de forma independente dos demais Contexts.