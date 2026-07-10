# Refund Workflow

> Workflow ID: WF-007
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Refund Context
>
> Aggregate Root: Refund
>
> Bounded Context: Refund
>
> Dependências:
>
> - payment.md
> - order-lifecycle.md
> - fulfillment.md
> - disputes.md
> - business-rules.md
> - permission-matrix.md
> - cqrs-pattern.md
> - transaction-boundaries.md
> - unit-of-work.md
> - domain-event-contracts.md

---

# Objetivo

O Refund Workflow controla todo o ciclo de vida dos reembolsos realizados pelo JudgeTCG.

Seu objetivo é garantir consistência financeira, rastreabilidade completa e auditoria durante qualquer devolução de valores ao comprador.

O Refund nunca altera diretamente o Aggregate Payment.

O Refund solicita operações financeiras ao Payment Context através de eventos.

---

# Filosofia

Order determina elegibilidade.

↓

Refund inicia o processo.

↓

Payment executa a devolução financeira.

↓

Refund acompanha o resultado.

↓

Order e Settlement são atualizados.

---

# Escopo

## Inclui

Solicitação de reembolso.

Validação de elegibilidade.

Reembolso parcial.

Reembolso total.

Reembolso automático.

Reembolso manual.

Reembolso por cancelamento.

Reembolso por devolução.

Reembolso por falha logística.

Auditoria.

---

## Não inclui

Chargeback.

Pagamento.

Criação de pedidos.

Disputas.

Entrega.

---

# Tipos de Refund

## Full Refund

100% do valor devolvido.

---

## Partial Refund

Parte do valor devolvida.

---

## Shipping Refund

Reembolso apenas do frete.

---

## Courtesy Refund

Reembolso excepcional autorizado pela plataforma.

---

## Automatic Refund

Executado automaticamente por regras do sistema.

---

## Manual Refund

Executado por administrador autorizado.

---

# Atores

Buyer

Seller

Administrador

Marketplace

Workers

Payment Context

---

# Pré-condições

Order existente.

Payment aprovado.

Pedido elegível para reembolso.

Políticas atendidas.

---

# Gatilhos

RequestRefundCommand

CancelOrderCommand

ReturnApproved

ShipmentLost

AdminRefundCommand

DisputeResolved

---

# Entradas

RefundReason

OrderId

PaymentId

Amount

Currency

Metadata

CorrelationId

RequestedBy

---

# Saídas

Refund criado.

Eventos publicados.

Solicitação ao Payment Context.

Atualização de auditoria.

Notificações.

---

# Aggregate Principal

Refund

Responsável por:

- elegibilidade;
- estado do reembolso;
- rastreabilidade;
- histórico;
- auditoria.

---

# Aggregates Relacionados

Payment

Order

Dispute

Settlement

Return

---

# Fluxo Principal

Receber solicitação.

↓

Validar elegibilidade.

↓

Criar Aggregate Refund.

↓

Persistir.

↓

Commit.

↓

Emitir RefundRequested.

↓

Payment Context consome evento.

↓

Gateway processa devolução.

↓

Webhook confirma.

↓

Payment publica RefundCompleted.

↓

Refund atualiza estado.

↓

Emitir RefundSucceeded.

↓

Order atualizado.

↓

Settlement atualizado.

---

# Fluxos Alternativos

## Valor inválido

Rejeitar solicitação.

---

## Pedido inelegível

RefundRejected.

---

## Gateway recusou

RefundFailed.

↓

Retry.

---

## Timeout

RefundPending.

---

## Webhook duplicado

Ignorar.

---

## Chargeback existente

Encaminhar para Chargeback Workflow.

---

# State Machine

```text
Requested
      │
      ▼
PendingApproval
      │
      ▼
Approved
      │
      ▼
Processing
      │
      ▼
Succeeded
```

Estados alternativos

```text
Rejected

Cancelled

Failed

Expired
```

Transições proibidas

Succeeded → Processing

Rejected → Approved

Cancelled → Requested

---

# Regras de Negócio

## BR-001

Todo Refund possui Order associado.

---

## BR-002

Todo Refund possui Payment associado.

---

## BR-003

Refund nunca altera Payment diretamente.

---

## BR-004

Refund parcial não pode exceder o valor disponível.

---

## BR-005

Refund total encerra futuras solicitações financeiras para o mesmo Payment, salvo exceções administrativas previstas.

---

## BR-006

Refund gera auditoria obrigatória.

---

## BR-007

Todo Refund possui motivo.

---

## BR-008

Refund aprovado gera evento.

---

## BR-009

Refund concluído nunca pode ser removido.

---

## BR-010

Múltiplos Refunds devem respeitar o saldo restante da transação.

---

# Permissões

Refund.View

Refund.Request

Refund.Approve

Refund.Reject

Refund.Manual

Refund.Admin

---

# Domain Policies

RefundEligibilityPolicy

RefundAmountPolicy

ReturnPolicy

CancellationPolicy

MarketplaceRefundPolicy

---

# Domain Services

RefundValidationService

RefundCalculationService

RefundApprovalService

RefundNotificationService

---

# Eventos Emitidos

RefundRequested

RefundApproved

RefundRejected

RefundProcessing

RefundSucceeded

RefundFailed

RefundCancelled

---

# Eventos Consumidos

PaymentRefundCompleted

PaymentRefundFailed

ReturnApproved

ShipmentLost

DisputeResolved

---

# Compensações

Falha no Gateway

↓

Retry.

---

Webhook perdido

↓

Reconciliação periódica.

---

Falha persistência

↓

Rollback.

---

# Background Processing

Reconciliação.

Emails.

Push.

Analytics.

Dashboard.

Financeiro.

Settlement.

---

# Integrações

Stripe

PIX

Supabase

Redis

Cloudflare

Event Bus

---

# SLA

SLA-001

Criar Refund

≤ 2 segundos

---

SLA-002

Solicitar Gateway

≤ 5 segundos

---

SLA-003

Atualizar estado

≤ 2 segundos após webhook

---

# Auditoria

Registrar

RefundId

OrderId

PaymentId

Actor

Amount

Reason

WorkflowId

CorrelationId

Timestamp

Estado anterior

Estado novo

---

# Observabilidade

CorrelationId

WorkflowId

Latency

GatewayLatency

RetryCount

FailureReason

---

# KPIs

KPI-001

Tempo médio de Refund.

---

KPI-002

Refunds aprovados.

---

KPI-003

Refunds rejeitados.

---

KPI-004

Refund parcial vs total.

---

KPI-005

Tempo até conclusão.

---

KPI-006

Retries.

---

# Anti Patterns

É proibido

Alterar Payment diretamente.

Excluir Refund.

Executar HTTP durante Transaction.

Criar Refund sem Order.

Criar Refund sem auditoria.

Executar SQL fora do Repository.

---

# Casos Extremos

Refund parcial seguido de total.

Gateway indisponível.

Webhook fora de ordem.

Múltiplos Refunds simultâneos.

Chargeback iniciado durante Refund.

Pedido cancelado após Refund solicitado.

---

# Implementação Esperada

```text
Order / Admin

↓

RequestRefundCommand

↓

Application Service

↓

Refund Aggregate

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

RefundRequested Event

↓

Payment Context

↓

Gateway

↓

Webhook

↓

PaymentRefundCompleted

↓

Refund Aggregate

↓

Commit

↓

Settlement Context

↓

Order Context
```

---

# Dependências

payment.md

order-lifecycle.md

fulfillment.md

disputes.md

business-rules.md

permission-matrix.md

repository-pattern.md

unit-of-work.md

transaction-boundaries.md

---

# Evolução

Versões futuras poderão incluir:

- Reembolso por item individual.
- Reembolso automático por SLA excedido.
- Carteira Judge Wallet.
- Crédito em conta para compras futuras.
- IA para detecção de abuso de Refund.
- Fluxos fiscais por país.
- Integração com sistemas de emissão de nota fiscal.

---

# Relação com Payment

O Refund nunca modifica diretamente o Aggregate Payment.

Ele publica eventos (`RefundRequested`) consumidos pelo Payment Context, que executa a devolução junto ao gateway e posteriormente publica eventos (`PaymentRefundCompleted` ou `PaymentRefundFailed`) para atualização do Aggregate Refund.

---

# Relação com Order

O Order mantém seu histórico operacional independentemente do Refund.

A conclusão de um Refund pode provocar transições previstas na State Machine do Order (como `Refunded` ou `Closed`), mas sempre por meio de eventos de domínio.

---

# Relação com Settlement

O Settlement Context utiliza os eventos do Refund para recalcular:

- saldo líquido do vendedor;
- comissões da plataforma;
- retenções;
- repasses pendentes;
- extrato financeiro.

Nenhum cálculo financeiro deve ocorrer dentro do Aggregate Refund.

---

# Regra Fundamental

O Refund representa exclusivamente o processo de devolução financeira de uma transação.

Ele controla elegibilidade, auditoria, rastreabilidade e estado do reembolso, delegando toda interação com gateways ao Payment Context e preservando o desacoplamento entre os domínios financeiro, comercial e operacional do JudgeTCG.