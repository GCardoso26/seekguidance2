# Payment Workflow

> Workflow ID: WF-004
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Payment Context
>
> Aggregate Root: Payment
>
> Bounded Context: Payment
>
> Dependências:
>
> - checkout.md
> - order-lifecycle.md
> - business-rules.md
> - pricing-engine.md
> - cqrs-pattern.md
> - transaction-boundaries.md
> - unit-of-work.md
> - domain-event-contracts.md
> - marketplace-architecture.md

---

# Objetivo

O Payment Workflow é responsável por controlar todo o ciclo de vida financeiro de uma compra.

Seu objetivo é transformar uma Checkout Session válida em um pagamento confirmado, recusado, expirado ou reembolsado.

O Payment é a única fonte oficial de verdade sobre o estado financeiro de uma compra.

Nenhum outro contexto pode alterar seu estado.

---

# Filosofia

Checkout valida.

↓

Payment autoriza.

↓

Order nasce.

↓

Settlement liquida.

---

# Escopo

## Inclui

Criação do Payment.

Criação do Payment Intent.

Autorização.

Captura.

Confirmação.

Expiração.

Falha.

Cancelamento.

Webhook.

Reembolso.

Chargeback.

Auditoria.

---

## Não inclui

Checkout.

Pedido.

Frete.

Separação.

Entrega.

Reputação.

Repasse financeiro.

---

# Atores

Buyer

Payment Gateway

Marketplace

Workers

Sistema

Stripe

Administrador

---

# Pré-condições

Checkout válido.

Snapshot financeiro congelado.

Buyer autenticado.

Store ativa.

Listings válidas.

Gateway disponível.

---

# Gatilhos

CreatePaymentCommand

StripeWebhookReceived

CancelPaymentCommand

RefundPaymentCommand

ChargebackReceived

PaymentTimeout

---

# Entradas

CheckoutId

BuyerId

StoreIds

Currency

Amount

PaymentMethod

Installments

Metadata

IdempotencyKey

CorrelationId

---

# Saídas

Payment criado.

Payment Intent.

Eventos.

Snapshot financeiro persistido.

Auditoria.

---

# Aggregate Principal

Payment

O Aggregate Payment protege:

- integridade financeira;
- transições de estado;
- idempotência;
- versionamento;
- consistência monetária.

---

# Aggregates Relacionados

CheckoutSession

Settlement

Refund

Chargeback

Order (somente por eventos)

---

# Fluxo Principal

Checkout solicita pagamento.

↓

Validar Checkout.

↓

Criar Aggregate Payment.

↓

Persistir.

↓

Commit.

↓

Emitir PaymentCreated.

↓

Criar Payment Intent.

↓

Enviar ao Gateway.

↓

Aguardar Webhook.

↓

Receber confirmação.

↓

Validar assinatura.

↓

Atualizar Aggregate Payment.

↓

Persistir.

↓

Commit.

↓

Emitir PaymentApproved.

↓

Order Context consome evento.

---

# Fluxos Alternativos

## Cartão recusado

PaymentFailed.

---

## PIX expirado

PaymentExpired.

---

## Webhook duplicado

Ignorar.

---

## Gateway indisponível

Retry.

---

## Timeout

PaymentExpired.

---

## Chargeback

Workflow próprio.

---

## Reembolso

Workflow próprio.

---

# State Machine

```text
Created
      │
      ▼
PendingAuthorization
      │
      ▼
Authorized
      │
      ▼
Captured
      │
      ▼
Approved
```

Estados alternativos

```text
Failed

Expired

Cancelled

RefundPending

Refunded

Chargeback

Disputed
```

Transições proibidas

Approved → Created

Refunded → Approved

Chargeback → Authorized

Expired → Approved

---

# Regras de Negócio

## BR-001

Somente o Aggregate Payment altera estados financeiros.

---

## BR-002

Order nasce apenas após PaymentApproved.

---

## BR-003

Todo webhook deve ser validado criptograficamente.

---

## BR-004

Idempotência é obrigatória.

---

## BR-005

Valores monetários são imutáveis.

---

## BR-006

Payment utiliza snapshot do Checkout.

---

## BR-007

Gateway nunca altera diretamente o banco.

---

## BR-008

Webhooks nunca executam regras comerciais.

---

## BR-009

Todo Payment possui CorrelationId.

---

## BR-010

Chargeback nunca altera Payment diretamente.

Origina novo Workflow.

---

# Permissões

Payment.Create

Payment.Cancel

Payment.Refund

Payment.View

Payment.Admin

---

# Domain Policies

PaymentEligibilityPolicy

InstallmentPolicy

CurrencyPolicy

RefundPolicy

GatewaySelectionPolicy

---

# Domain Services

PaymentGatewayService

PaymentValidationService

CurrencyService

InstallmentService

FraudDetectionService

---

# Eventos Emitidos

PaymentCreated

PaymentIntentCreated

PaymentAuthorized

PaymentCaptured

PaymentApproved

PaymentFailed

PaymentExpired

PaymentCancelled

PaymentRefundRequested

PaymentRefunded

PaymentChargebackOpened

---

# Eventos Consumidos

CheckoutReadyForPayment

StripeWebhookReceived

RefundApproved

ChargebackReceived

---

# Compensações

Falha Gateway

↓

Retry Worker

---

Webhook inválido

↓

Registrar tentativa

↓

Ignorar

---

Falha Persistência

↓

Rollback

↓

Nenhum evento publicado

---

# Background Processing

Processar Webhooks

Enviar Emails

Atualizar Dashboard

Atualizar Analytics

Atualizar Financeiro

Atualizar Cache

Limpeza de Payments expirados

---

# Integrações

Stripe

PIX

Redis

Cloudflare

Supabase

Event Bus

---

# SLA

SLA-001

Criar Payment

≤ 2 segundos

---

SLA-002

Criar Payment Intent

≤ 5 segundos

---

SLA-003

Processar Webhook

≤ 3 segundos

---

SLA-004

Publicar PaymentApproved

≤ 2 segundos

---

# Auditoria

Registrar

PaymentId

CheckoutId

GatewayId

TransactionId

CorrelationId

WorkflowId

IdempotencyKey

Payload resumido

Timestamp

---

# Observabilidade

CorrelationId

WorkflowId

Latency

GatewayLatency

WebhookLatency

RetryCount

FailureReason

IdempotencyKey

---

# KPIs

KPI-001

Taxa de aprovação.

---

KPI-002

Tempo médio de autorização.

---

KPI-003

Falhas.

---

KPI-004

Chargebacks.

---

KPI-005

PIX expirados.

---

KPI-006

Tempo de Webhook.

---

KPI-007

Retries.

---

# Anti Patterns

É proibido

Criar Order.

Reservar estoque.

Executar lógica comercial.

Alterar Checkout.

Executar SQL fora do Repository.

Confiar apenas na resposta síncrona do Gateway.

Ignorar Webhook.

Publicar eventos antes do Commit.

---

# Casos Extremos

Webhook duplicado.

Webhook fora de ordem.

Gateway indisponível.

PIX expirado.

Timeout.

Retry.

Chargeback posterior.

Reembolso parcial.

---

# Implementação Esperada

```text
Checkout

↓

Payment Context

↓

CreatePaymentCommand

↓

Validator

↓

Application Service

↓

Payment Aggregate

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

Gateway Worker

↓

Stripe

↓

Webhook

↓

Payment Aggregate

↓

Commit

↓

PaymentApproved

↓

Order Context
```

---

# Dependências

checkout.md

order-lifecycle.md

refunds.md

business-rules.md

pricing-engine.md

repository-pattern.md

unit-of-work.md

transaction-boundaries.md

---

# Evolução

Versões futuras poderão incluir:

- Múltiplos gateways.
- Smart Routing entre adquirentes.
- Wallet Judge.
- Split Payments.
- PIX Automático.
- PIX Agendado.
- Cartão salvo.
- Apple Pay.
- Google Pay.
- Criptomoedas.
- Antifraude por IA.
- Retry inteligente de pagamentos.
- Conciliação automática.

---

# Fluxo Resumido

```text
Checkout Ready

      │

      ▼

Create Payment

      │

      ▼

Persist Payment

      │

      ▼

Commit

      │

      ▼

PaymentIntent

      │

      ▼

Stripe

      │

      ▼

Webhook

      │

      ▼

Validate Signature

      │

      ▼

PaymentApproved

      │

      ▼

Commit

      │

      ▼

PaymentApproved Event

      │

      ▼

Order Context
```

---

# Relação com Checkout

O Payment nunca recalcula valores.

Todos os valores monetários utilizados pelo Payment são provenientes do snapshot congelado da CheckoutSession.

Isso garante que alterações posteriores em preços, fretes, descontos ou campanhas não afetem transações já iniciadas.

---

# Relação com Order

O Payment não cria Orders diretamente.

Após a confirmação do pagamento, o Aggregate Payment emite o evento `PaymentApproved`.

O Order Context é o único responsável por consumir esse evento e decidir se um novo Order será criado.

Essa separação elimina acoplamento entre os contextos financeiro e comercial.

---

# Relação com Settlement

O Payment encerra sua responsabilidade após confirmar o pagamento.

A distribuição financeira para vendedores, cálculo de comissões, retenções, repasses e liquidação pertencem exclusivamente ao Settlement Workflow.

---

# Segurança

Todo webhook deve obrigatoriamente:

- validar assinatura digital do gateway;
- validar timestamp contra ataques de replay;
- utilizar Idempotency Key;
- registrar payload bruto para auditoria;
- nunca executar lógica de negócio diretamente;
- publicar apenas eventos de domínio após Commit.

Nenhum endpoint interno poderá alterar estados do Aggregate Payment sem passar pelas regras de domínio.

---

# Regra Fundamental

O Payment é a autoridade financeira do JudgeTCG.

Somente o Aggregate `Payment` pode controlar o ciclo de vida de uma transação monetária.

Toda comunicação com gateways externos deve ocorrer de forma assíncrona, orientada a eventos e protegida por idempotência, validação criptográfica, auditoria completa e rastreabilidade.

Nenhum outro contexto da plataforma pode alterar o estado financeiro de uma compra ou criar pedidos sem que o evento `PaymentApproved` tenha sido oficialmente emitido pelo Payment Context.