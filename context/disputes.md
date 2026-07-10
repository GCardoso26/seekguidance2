# Dispute Workflow

> Workflow ID: WF-008
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Dispute Context
>
> Aggregate Root: Dispute
>
> Bounded Context: Dispute
>
> Dependências:
>
> - order-lifecycle.md
> - refunds.md
> - fulfillment.md
> - payment.md
> - settlement.md (futuro)
> - business-rules.md
> - permission-matrix.md
> - cqrs-pattern.md
> - transaction-boundaries.md
> - unit-of-work.md
> - domain-event-contracts.md

---

# Objetivo

O Dispute Workflow controla todo o processo formal de resolução de conflitos entre comprador, vendedor e plataforma.

Uma disputa representa um processo comercial oficial, com regras próprias, auditoria completa e rastreabilidade.

O Aggregate Dispute é a única autoridade sobre o estado de uma disputa.

Nenhum Ticket pode substituir uma Dispute.

---

# Filosofia

Order executa.

↓

Problema identificado.

↓

Dispute inicia.

↓

Coleta de evidências.

↓

Análise.

↓

Decisão.

↓

Refund / Settlement / Reputation.

---

# Escopo

## Inclui

Abertura de disputa.

Elegibilidade.

Coleta de evidências.

Análise.

Mediação.

Decisão.

Encerramento.

Auditoria.

---

## Não inclui

Tickets.

Chat geral.

Pagamentos.

Reembolsos.

Entrega.

---

# Tipos de Disputa

## Produto não recebido

Item não entregue.

---

## Produto divergente

Carta diferente.

Idioma incorreto.

Raridade incorreta.

Versão incorreta.

---

## Condição divergente

Near Mint enviado como Played.

---

## Produto danificado

Danos físicos.

---

## Pacote perdido

Extravio.

---

## Fraude

Tentativa comprovada de fraude.

---

## Outros

Classificação manual.

---

# Atores

Buyer

Seller

Moderador

Administrador

Marketplace

Workers

---

# Pré-condições

Order existente.

Payment aprovado.

Pedido elegível.

Prazo de disputa válido.

---

# Gatilhos

OpenDisputeCommand

ShipmentLost

DeliveryIssueReported

AdminOpenDispute

ChargebackNotification

---

# Entradas

OrderId

BuyerId

StoreId

Reason

Evidence

Attachments

Comments

CorrelationId

---

# Saídas

Dispute criada.

Timeline.

Eventos.

Notificações.

Auditoria.

---

# Aggregate Principal

Dispute

Responsável por:

- estado do processo;
- elegibilidade;
- evidências;
- decisão;
- auditoria.

---

# Aggregates Relacionados

Order

Refund

Settlement

Review

Reputation

Payment

---

# Fluxo Principal

Buyer abre disputa.

↓

Validar elegibilidade.

↓

Criar Aggregate.

↓

Persistir.

↓

Commit.

↓

DisputeOpened.

↓

Solicitar evidências.

↓

Receber evidências.

↓

Análise automática.

↓

Análise humana (quando necessário).

↓

Decisão.

↓

Publicar eventos.

↓

Atualizar Order.

↓

Atualizar Settlement.

↓

Atualizar Reputation.

↓

Encerrar disputa.

---

# Fluxos Alternativos

## Evidências insuficientes

Solicitar complementação.

---

## Seller não responde

Decisão automática.

---

## Buyer abandona disputa

Cancelar.

---

## Fraude confirmada

Escalar Compliance.

---

## Chargeback recebido

Encaminhar Chargeback Workflow.

---

# State Machine

```text
Opened
      │
      ▼
WaitingBuyer
      │
      ▼
WaitingSeller
      │
      ▼
EvidenceCollection
      │
      ▼
UnderReview
      │
      ▼
Resolved
      │
      ▼
Closed
```

Estados alternativos

```text
Cancelled

Rejected

Escalated

FraudInvestigation
```

Transições proibidas

Closed → Opened

Resolved → WaitingBuyer

Cancelled → UnderReview

---

# Regras de Negócio

## BR-001

Uma disputa sempre pertence a um único Order.

---

## BR-002

Um Order pode possuir múltiplas disputas ao longo de sua vida, desde que não exista outra disputa ativa simultaneamente.

---

## BR-003

Toda evidência é imutável.

---

## BR-004

Toda decisão é auditada.

---

## BR-005

Disputas encerradas nunca podem ser alteradas.

---

## BR-006

Settlement permanece bloqueado enquanto houver disputa ativa.

---

## BR-007

Refund somente poderá ser iniciado conforme política definida na decisão da disputa.

---

## BR-008

Reputation deve ser recalculada após decisão definitiva.

---

## BR-009

Toda disputa possui prazo máximo de resolução (SLA).

---

## BR-010

Moderadores nunca alteram diretamente Payment ou Order.

Eles apenas publicam decisões.

---

# Permissões

Dispute.View

Dispute.Open

Dispute.Comment

Dispute.UploadEvidence

Dispute.Review

Dispute.Resolve

Dispute.Admin

---

# Domain Policies

DisputeEligibilityPolicy

EvidencePolicy

ResolutionPolicy

FraudPolicy

MarketplaceProtectionPolicy

---

# Domain Services

DisputeValidationService

EvidenceStorageService

DisputeDecisionService

FraudAnalysisService

NotificationService

---

# Eventos Emitidos

DisputeOpened

EvidenceRequested

EvidenceSubmitted

DisputeEscalated

DisputeResolved

DisputeClosed

DisputeCancelled

FraudDetected

---

# Eventos Consumidos

ShipmentLost

RefundSucceeded

ChargebackOpened

OrderCompleted

---

# Compensações

Falha upload

↓

Retry.

---

Falha persistência

↓

Rollback.

---

Falha decisão

↓

Escalar moderador.

---

# Background Processing

Lembretes de SLA.

Análise automática.

IA para fraude (futuro).

Atualização de Reputation.

Atualização de Settlement.

Analytics.

Dashboard.

---

# Integrações

Supabase

Redis

Cloudflare

Object Storage

Notification Service

Event Bus

---

# SLA

SLA-001

Abrir disputa

≤ 2 segundos

---

SLA-002

Primeira resposta

≤ 24 horas

---

SLA-003

Conclusão

≤ 7 dias (configurável)

---

# Auditoria

Registrar

DisputeId

OrderId

BuyerId

StoreId

Actor

Reason

EvidenceIds

WorkflowId

CorrelationId

Decision

Timestamp

---

# Observabilidade

CorrelationId

WorkflowId

Latency

EvidenceCount

RetryCount

ResolutionTime

---

# KPIs

KPI-001

Disputas abertas.

---

KPI-002

Tempo médio de resolução.

---

KPI-003

Vitórias Buyer.

---

KPI-004

Vitórias Seller.

---

KPI-005

Fraudes detectadas.

---

KPI-006

Reembolsos originados.

---

KPI-007

Impacto na reputação.

---

# Anti Patterns

É proibido

Resolver disputa via Ticket.

Editar evidências.

Alterar Payment diretamente.

Alterar Order diretamente.

Excluir disputa.

Executar integrações externas durante Transaction.

Ignorar auditoria.

---

# Casos Extremos

Fraude organizada.

Múltiplas evidências.

Chargeback durante disputa.

Extravio confirmado após decisão.

Buyer e Seller enviam evidências conflitantes.

Disputa reaberta por decisão judicial (processo administrativo extraordinário).

---

# Implementação Esperada

```text
Buyer

↓

OpenDisputeCommand

↓

Application Service

↓

Dispute Aggregate

↓

Repository

↓

Unit Of Work

↓

Persist Audit

↓

Persist Outbox

↓

Commit

↓

DisputeOpened

↓

Moderation Queue

↓

Decision Engine

↓

DisputeResolved

↓

Refund Context

↓

Settlement Context

↓

Reputation Context

↓

Order Context
```

---

# Dependências

order-lifecycle.md

refunds.md

payment.md

fulfillment.md

business-rules.md

permission-matrix.md

repository-pattern.md

unit-of-work.md

transaction-boundaries.md

---

# Evolução

Versões futuras poderão incluir:

- IA para análise automática de evidências.
- OCR de comprovantes.
- Reconhecimento de imagens das cartas.
- Score antifraude.
- Arbitragem externa.
- Seguro de compra.
- Sistema de mediação por especialistas.
- Integração com órgãos de defesa do consumidor.

---

# Relação com Refund

O Aggregate Dispute nunca executa reembolsos.

Ele apenas publica a decisão que poderá originar um `RefundRequested` conforme as políticas definidas.

---

# Relação com Settlement

Enquanto existir uma disputa ativa, o Settlement poderá manter valores retidos conforme a política financeira da plataforma.

A decisão final da disputa determinará a continuidade ou reversão do processo de liquidação financeira.

---

# Relação com Reputation

Toda decisão definitiva poderá impactar a reputação do comprador, do vendedor ou de ambos.

Os cálculos são realizados pelo Reputation Context após o evento `DisputeResolved`.

---

# Regra Fundamental

A Dispute representa o processo oficial de resolução de conflitos do JudgeTCG.

Ela opera de forma independente dos contextos de Atendimento, Pagamentos e Pedidos, preservando isolamento de responsabilidades, rastreabilidade, auditoria e consistência do domínio.

Nenhuma decisão operacional ou financeira poderá ser executada diretamente pelo Aggregate `Dispute`; todas as consequências deverão ser propagadas exclusivamente por eventos de domínio.