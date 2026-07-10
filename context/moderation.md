# Moderation Workflow

> Workflow ID: WF-010
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Moderation Context
>
> Aggregate Root: ModerationCase
>
> Bounded Context: Moderation
>
> Dependências:
>
> - reputation.md
> - disputes.md
> - refunds.md
> - payment.md
> - order-lifecycle.md
> - governance-patterns.md
> - business-rules.md
> - permission-matrix.md
> - cqrs-pattern.md
> - unit-of-work.md
> - transaction-boundaries.md

---

# Objetivo

O Moderation Workflow é responsável por proteger a integridade do ecossistema JudgeTCG.

Ele centraliza denúncias, violações de políticas, fraudes, abusos e demais comportamentos incompatíveis com as regras da plataforma.

A moderação nunca altera diretamente outros Aggregates.

Ela produz decisões oficiais que são propagadas através de eventos de domínio.

---

# Filosofia

Evento ocorre.

↓

Caso de moderação é criado.

↓

Evidências são coletadas.

↓

Análise automática.

↓

Análise humana (quando necessário).

↓

Decisão.

↓

Eventos publicados.

↓

Outros Contexts aplicam consequências.

---

# Escopo

## Inclui

Recebimento de denúncias.

Abertura de casos.

Análise de evidências.

Investigação.

Advertências.

Suspensões.

Banimentos.

Remoção de conteúdo.

Congelamento preventivo.

Auditoria.

---

## Não inclui

Tickets.

Disputas comerciais.

Pagamentos.

Reembolsos.

Cálculo de Reputation.

---

# Tipos de Caso

## Loja

Violação operacional.

---

## Usuário

Comportamento inadequado.

---

## Listing

Produto proibido.

Imagem inadequada.

Preço abusivo.

Spam.

---

## Review

Review ofensiva.

Review falsa.

Manipulação.

---

## Chat

Ofensas.

Fraudes.

Tentativas de golpe.

---

## Financeiro

Lavagem de dinheiro.

Fraude.

Chargeback em massa.

---

## Sistema

Bots.

Automação proibida.

Ataques.

---

# Atores

Buyer

Seller

Moderador

Administrador

Sistema

Workers

Compliance

---

# Pré-condições

Denúncia recebida

ou

Detecção automática

ou

Evento suspeito

---

# Gatilhos

OpenModerationCaseCommand

ReportReceived

FraudDetected

MassReportsDetected

DisputeEscalated

ComplianceRuleTriggered

---

# Entradas

CaseType

EntityId

EntityType

Reporter

Evidence

Reason

CorrelationId

---

# Saídas

ModerationCase criada.

Eventos.

Auditoria.

Notificações.

---

# Aggregate Principal

ModerationCase

Responsável por:

- estado do processo;
- evidências;
- decisões;
- histórico;
- auditoria.

---

# Aggregates Relacionados

Store

Player

Listing

Review

Reputation

Dispute

Settlement

---

# Fluxo Principal

Receber denúncia.

↓

Criar ModerationCase.

↓

Persistir.

↓

Commit.

↓

Solicitar evidências.

↓

Análise automática.

↓

Fila humana (quando necessário).

↓

Tomar decisão.

↓

Persistir decisão.

↓

Commit.

↓

Publicar eventos.

↓

Encerrar caso.

---

# Fluxos Alternativos

## Denúncia inválida

Arquivar.

---

## Evidências insuficientes

Solicitar complementação.

---

## Fraude confirmada

Escalar Compliance.

---

## Alta severidade

Suspensão preventiva.

---

## Recurso

Novo Workflow de Appeal.

---

# State Machine

```text
Opened

↓

EvidenceCollection

↓

AutomaticReview

↓

ManualReview

↓

DecisionMade

↓

Closed
```

Estados alternativos

```text
Dismissed

Escalated

Appealed

Frozen
```

Transições proibidas

Closed → Opened

Dismissed → ManualReview

DecisionMade → Opened

---

# Níveis de Severidade

Low

Medium

High

Critical

Emergency

Cada nível possui SLA, permissões e ações permitidas.

---

# Decisões Possíveis

Nenhuma ação.

Advertência.

Remoção de conteúdo.

Ocultação de anúncios.

Suspensão temporária.

Suspensão definitiva.

Congelamento financeiro.

Escalonamento para Compliance.

---

# Regras de Negócio

## BR-001

Todo caso possui auditoria completa.

---

## BR-002

Toda decisão possui responsável.

---

## BR-003

Toda decisão gera evento.

---

## BR-004

Casos encerrados nunca são editados.

---

## BR-005

Moderation nunca altera diretamente outros Aggregates.

---

## BR-006

Toda penalidade é aplicada pelos Contexts responsáveis.

---

## BR-007

Casos críticos possuem prioridade máxima.

---

## BR-008

Toda evidência é imutável.

---

## BR-009

Casos podem ser reabertos apenas por Workflow de Appeal.

---

## BR-010

Regras são definidas exclusivamente pelo Compliance.

---

# Permissões

Moderation.View

Moderation.Review

Moderation.Resolve

Moderation.Suspend

Moderation.Ban

Moderation.Admin

---

# Domain Policies

ModerationPolicy

EvidencePolicy

PenaltyPolicy

AppealPolicy

CompliancePolicy

---

# Domain Services

ModerationEngine

EvidenceAnalysisService

PenaltyService

AppealService

FraudDetectionService

---

# Eventos Emitidos

ModerationCaseOpened

EvidenceRequested

EvidenceReceived

ModerationDecisionMade

StoreSuspensionRequested

ListingRemovalRequested

UserWarningIssued

UserBanRequested

SettlementFreezeRequested

ModerationCaseClosed

---

# Eventos Consumidos

ReportReceived

FraudDetected

DisputeResolved

MassReportsDetected

ComplianceRuleTriggered

---

# Compensações

Falha persistência

↓

Rollback.

---

Falha publicação

↓

Outbox Retry.

---

Erro IA

↓

Encaminhar revisão humana.

---

# Background Processing

Detecção automática.

Análise IA.

Fila de revisão.

Analytics.

Dashboard.

Relatórios.

---

# Integrações

Object Storage

Redis

Supabase

Notification Service

Analytics

Cloudflare

Event Bus

---

# SLA

Low

≤ 7 dias

---

Medium

≤ 72 horas

---

High

≤ 24 horas

---

Critical

≤ 4 horas

---

Emergency

Imediato

---

# Auditoria

Registrar

ModerationCaseId

Actor

Evidence

Decision

Penalty

WorkflowId

CorrelationId

Timestamp

---

# Observabilidade

Latency

QueueTime

ReviewTime

AppealRate

AutomationRate

FalsePositiveRate

---

# KPIs

KPI-001

Casos abertos.

---

KPI-002

Tempo médio de resolução.

---

KPI-003

Casos automatizados.

---

KPI-004

Casos revertidos.

---

KPI-005

Fraudes detectadas.

---

KPI-006

Banimentos.

---

KPI-007

Taxa de recursos.

---

# Anti Patterns

É proibido

Editar evidências.

Alterar Payment.

Alterar Order.

Alterar Reputation.

Executar SQL direto.

Ignorar auditoria.

Aplicar penalidades diretamente.

---

# Casos Extremos

Ataque coordenado.

Denúncias em massa.

Falsas denúncias.

Bots.

Fraude organizada.

Tentativa de evasão.

Recursos sucessivos.

---

# Implementação Esperada

```text
Report

↓

OpenModerationCaseCommand

↓

Application Service

↓

ModerationCase Aggregate

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

ModerationDecisionMade

↓

Event Bus

↓

Store Context

↓

Listing Context

↓

Settlement Context

↓

Reputation Context

↓

Notification Context
```

---

# Dependências

reputation.md

disputes.md

payment.md

business-rules.md

permission-matrix.md

repository-pattern.md

unit-of-work.md

---

# Evolução

Versões futuras poderão incluir:

- IA para classificação automática.
- OCR para documentos.
- Reconhecimento de imagens de cartas falsas.
- Fingerprinting de dispositivos.
- Detecção de redes de fraude.
- Sistema de Appeals completo.
- Risk Score em tempo real.
- Moderação preventiva baseada em ML.

---

# Relação com Compliance

O Moderation Context executa as políticas definidas pelo Compliance.

Ele não define regras.

Ele aplica decisões.

Toda alteração nas políticas ocorre sem necessidade de modificar o Aggregate ModerationCase.

---

# Relação com Reputation

O Moderation publica eventos como `ModerationDecisionMade`, `StoreSuspensionRequested` e `UserBanRequested`.

O Reputation Context consome esses eventos para recalcular os indicadores de confiança quando necessário.

---

# Relação com Settlement

Em casos de fraude ou violações graves, a decisão de moderação pode publicar `SettlementFreezeRequested`.

O Settlement Context decide como aplicar retenções, bloqueios ou liberações financeiras conforme suas próprias políticas.

---

# Regra Fundamental

O Moderation Workflow é responsável por preservar a integridade do ecossistema JudgeTCG por meio da análise de denúncias, evidências e violações de políticas.

Todas as decisões são orientadas por regras de Compliance, registradas em auditoria, propagadas por eventos de domínio e aplicadas pelos Contexts responsáveis, mantendo baixo acoplamento e alta rastreabilidade em toda a plataforma.