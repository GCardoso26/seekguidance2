# Checkout Workflow

> Workflow ID: WF-003
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Marketplace Context
>
> Aggregate Root: CheckoutSession
>
> Bounded Context: Marketplace
>
> Dependências:
>
> - listing-lifecycle.md
> - pricing-engine.md
> - marketplace-architecture.md
> - permission-matrix.md
> - business-rules.md
> - cqrs-pattern.md
> - transaction-boundaries.md
> - unit-of-work.md
> - domain-event-contracts.md

---

# Objetivo

O Checkout representa a intenção de compra do comprador.

Seu objetivo é validar completamente a operação comercial antes da autorização do pagamento.

O Checkout nunca cria um Order.

O Checkout nunca reserva estoque permanentemente.

O Checkout apenas produz uma Checkout Session válida que poderá originar um Payment.

---

# Filosofia

Checkout valida.

↓

Payment autoriza.

↓

Order nasce.

---

# Escopo

## Inclui

Criação da Checkout Session.

Validação das Listings.

Validação das quantidades.

Validação do vendedor.

Validação do comprador.

Cálculo de preços.

Cálculo de frete.

Aplicação de cupons.

Aplicação de cashback.

Aplicação de créditos.

Aplicação das taxas.

Criação do Payment Intent.

---

## Não inclui

Captura do pagamento.

Criação do Order.

Separação.

Envio.

Reputação.

Liberação financeira.

---

# Atores

Buyer

Marketplace

Store

Payment Gateway

Workers

Sistema

---

# Pré-condições

Buyer autenticado.

Conta ativa.

Listings publicadas.

Stores ativas.

Quantidade disponível.

Checkout válido.

Nenhum item expirado.

---

# Gatilhos

CreateCheckoutCommand

UpdateCheckoutCommand

ApplyCouponCommand

RemoveCouponCommand

SelectShippingCommand

CreatePaymentIntentCommand

---

# Entradas

BuyerId

Items[]

ListingId

Quantidade

Endereço

Cupom

Método de entrega

Método de pagamento

Observações

---

# Aggregate Principal

CheckoutSession

Representa uma sessão temporária de compra.

Nunca representa um pedido.

---

# Aggregates Relacionados

Listing

Inventory

Store

Coupon

ShippingOption

Pricing

Buyer

---

# Fluxo Principal

Buyer inicia Checkout.

↓

Validar autenticação.

↓

Validar Listings.

↓

Validar estoque.

↓

Validar preços.

↓

Validar vendedores.

↓

Calcular subtotal.

↓

Calcular descontos.

↓

Aplicar cupons.

↓

Calcular frete.

↓

Calcular taxas.

↓

Calcular total.

↓

Persistir CheckoutSession.

↓

Commit.

↓

Emitir CheckoutCreated.

↓

Criar Payment Intent.

↓

Emitir CheckoutReadyForPayment.

↓

Retornar CheckoutSession.

---

# Fluxos Alternativos

## Listing removida

Abortar Checkout.

---

## Estoque insuficiente

Solicitar atualização do carrinho.

---

## Preço alterado

Atualizar Checkout.

Solicitar confirmação.

---

## Cupom inválido

Remover cupom.

Recalcular total.

---

## Frete indisponível

Solicitar novo método.

---

## Timeout

Checkout expira.

---

# State Machine

```text
Draft
   │
   ▼
Validated
   │
   ▼
PricingCalculated
   │
   ▼
ReadyForPayment
   │
   ▼
Expired
```

Estados alternativos

```text
Cancelled

Failed

ConvertedToPayment
```

---

# Regras de Negócio

## BR-001

Checkout nunca cria Order.

---

## BR-002

Checkout possui tempo de vida limitado.

---

## BR-003

Listings devem permanecer publicadas.

---

## BR-004

Store deve permanecer ativa.

---

## BR-005

Toda alteração recalcula preços.

---

## BR-006

Frete sempre recalcula total.

---

## BR-007

Checkout expirado não pode ser reutilizado.

---

## BR-008

Checkout é imutável após Payment Intent.

---

## BR-009

Todos os valores monetários devem ser congelados na CheckoutSession antes da criação do Payment Intent.

---

## BR-010

A CheckoutSession deve possuir snapshot das Listings, preços, descontos, frete, impostos e taxas para garantir consistência entre pagamento e criação do Order.

---

# Permissões

Checkout.Create

Checkout.Update

Checkout.Cancel

Checkout.ApplyCoupon

Checkout.SelectShipping

Checkout.CreatePaymentIntent

---

# Domain Policies

CheckoutEligibilityPolicy

CouponPolicy

ShippingPolicy

MarketplaceFeePolicy

PricingPolicy

---

# Domain Services

PricingService

ShippingCalculationService

CouponService

MarketplaceFeeService

CheckoutValidationService

---

# Eventos Emitidos

CheckoutCreated

CheckoutUpdated

CheckoutValidated

CheckoutExpired

CheckoutCancelled

CheckoutPricingCalculated

CheckoutReadyForPayment

PaymentIntentRequested

---

# Eventos Consumidos

ListingUpdated

InventoryAdjusted

PriceChanged

CouponApplied

CouponRevoked

StoreSuspended

---

# Compensações

Falha durante cálculo

↓

Rollback

↓

Nenhuma sessão criada

---

Falha ao criar Payment Intent

↓

Checkout permanece ReadyForPayment

↓

Retry permitido

---

# Background Processing

Atualizar Analytics

Atualizar Dashboard

Enviar abandono de carrinho

Atualizar métricas

Limpar sessões expiradas

Enviar eventos

---

# Integrações

Stripe

Redis

Analytics

Notification Service

Cloudflare

Event Bus

---

# SLA

SLA-001

Criar Checkout

≤ 2 segundos

---

SLA-002

Calcular total

≤ 500 ms

---

SLA-003

Criar Payment Intent

≤ 5 segundos

---

# Auditoria

Registrar

CheckoutId

BuyerId

StoreIds

ListingIds

CorrelationId

WorkflowId

Valores

Descontos

Frete

Método de pagamento

Timestamp

---

# Observabilidade

CorrelationId

WorkflowId

Latency

RetryCount

PaymentIntentLatency

PricingLatency

ShippingLatency

---

# KPIs

KPI-001

Tempo médio de Checkout.

---

KPI-002

Conversão Checkout → Pagamento.

---

KPI-003

Abandono de Checkout.

---

KPI-004

Tempo médio de cálculo.

---

KPI-005

Falhas por etapa.

---

KPI-006

Uso de cupons.

---

KPI-007

Tempo até expiração.

---

# Anti Patterns

É proibido

Criar Order.

Reservar estoque permanentemente.

Cobrar pagamento.

Modificar Listings.

Executar HTTP durante Transaction.

Persistir Payment.

Ignorar snapshot financeiro.

---

# Casos Extremos

Preço alterado durante Checkout.

Listing arquivada.

Store suspensa.

Cupom expirado.

Frete indisponível.

Timeout.

Retry.

Webhook duplicado.

---

# Implementação Esperada

```text
Controller

↓

CreateCheckoutCommand

↓

Validator

↓

Application Service

↓

PricingService

↓

ShippingCalculationService

↓

CouponService

↓

Checkout Aggregate

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

Event Bus

↓

Payment Context

↓

Workers

↓

Analytics Projection
```

---

# Dependências

listing-lifecycle.md

pricing-engine.md

payment.md

business-rules.md

permission-matrix.md

repository-pattern.md

transaction-boundaries.md

unit-of-work.md

---

# Evolução

Versões futuras poderão incluir:

- Compra em um clique (One Click Checkout).
- Checkout persistente entre dispositivos.
- Carteira Judge Wallet.
- PIX Copia e Cola.
- PIX Automático.
- Parcelamento inteligente.
- Gift Cards.
- Créditos promocionais.
- Frete combinado inteligente.
- Split automático por múltiplos vendedores.

---

# Fluxo Resumido

```text
Buyer

      │

      ▼

Criar Checkout

      │

      ▼

Validar Listings

      │

      ▼

Validar Estoque

      │

      ▼

Calcular Pricing

      │

      ▼

Calcular Frete

      │

      ▼

Aplicar Cupons

      │

      ▼

Congelar Snapshot Financeiro

      │

      ▼

Criar CheckoutSession

      │

      ▼

Commit

      │

      ▼

CheckoutReadyForPayment

      │

      ▼

Payment Intent
```

---

# Snapshot Financeiro

A CheckoutSession deve armazenar um snapshot completo da operação comercial.

Esse snapshot é a fonte oficial para criação do Payment e, posteriormente, do Order.

O snapshot deve conter:

- Dados das Listings.
- Dados dos vendedores.
- Quantidades.
- Preços unitários.
- Descontos.
- Cupons.
- Taxas da plataforma.
- Custos de frete.
- Método de pagamento.
- Totais.
- Versões das Listings.

Mesmo que uma Listing seja alterada após a criação do Checkout, o Order deverá utilizar o snapshot congelado.

---

# Relação com Payment

O Checkout apenas solicita a criação do Payment Intent.

Após isso, a responsabilidade é transferida para o Payment Context.

O Checkout nunca confirma pagamentos.

Nunca captura pagamentos.

Nunca consulta o Gateway diretamente após a criação do Payment Intent.

---

# Relação com Order

Orders somente podem nascer após o evento:

PaymentApproved

Nenhum outro evento pode originar um Order.

Isso elimina pedidos órfãos, carrinhos abandonados e inconsistências financeiras.

---

# Regra Fundamental

O Checkout representa exclusivamente a intenção validada de compra.

Ele consolida todas as informações comerciais da operação em um snapshot imutável, pronto para originar um Payment.

Pedidos somente existirão após a confirmação do pagamento, garantindo consistência entre o Marketplace, o contexto de Pagamentos e o ciclo de vida do Order.