 # Order Lifecycle Workflow

> Workflow ID: WF-005
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Order Context
>
> Aggregate Root: Order
>
> Bounded Context: Order
>
> Dependências:
>
> - checkout.md
> - payment.md
> - fulfillment.md
> - refunds.md
> - disputes.md
> - business-rules.md
> - permission-matrix.md
> - domain-event-contracts.md
> - cqrs-pattern.md
> - unit-of-work.md
> - transaction-boundaries.md

---

# Objetivo

O Order representa o contrato comercial firmado entre comprador e vendedor após a confirmação do pagamento.

Ele controla todo o ciclo operacional da venda até sua conclusão, cancelamento ou abertura de disputa.

O Aggregate Order é responsável por proteger todas as invariantes comerciais da transação.

Nenhum outro Aggregate pode alterar seu estado diretamente.

---

# Filosofia

Checkout valida.

↓

Payment confirma.

↓

Order nasce.

↓

Fulfillment executa.

↓

Entrega conclui.

↓

Settlement libera.

---

# Escopo

## Inclui

Criação do Order.

Snapshot comercial.

Fluxo operacional.

Aceite automático.

Separação.

Empacotamento.

Envio.

Entrega.

Conclusão.

Cancelamento.

Disputa.

---

## Não inclui

Pagamento.

Captura.

Reembolso financeiro.

Repasse financeiro.

Reputação.

---

# Atores

Buyer

Seller

Marketplace

Workers

Transportadora

Administrador

Sistema

---

# Pré-condições

PaymentApproved emitido.

Checkout válido.

Snapshot financeiro disponível.

Store ativa.

Listings válidas.

---

# Gatilho

Evento:

PaymentApproved

Nenhum outro evento pode criar Orders.

---

# Entradas

PaymentId

CheckoutSnapshot

Buyer

Store

Listings

Frete

Totais

Metadata

CorrelationId

---

# Saídas

Order criado.

Eventos.

Atualizações operacionais.

Auditoria.

Notificações.

---

# Aggregate Principal

Order

O Aggregate protege:

- State Machine;
- Snapshot comercial;
- Fluxo operacional;
- Consistência da venda;
- Auditoria.

---

# Aggregates Relacionados

Payment (somente leitura via evento)

Shipment

Refund

Dispute

Review

Settlement

---

# Fluxo Principal

Receber PaymentApproved.

↓

Criar Aggregate Order.

↓

Persistir Snapshot.

↓

Persistir.

↓

Commit.

↓

Emitir OrderCreated.

↓

Aceite automático.

↓

OrderAccepted.

↓

Separação.

↓

Empacotamento.

↓

Envio.

↓

Entrega.

↓

Confirmação.

↓

OrderCompleted.

↓

Settlement inicia.

---

# Fluxos Alternativos

## Seller cancela antes do envio

OrderCancelled.

↓

Refund Workflow.

---

## Buyer cancela antes do envio

Validar política.

↓

Cancelar.

↓

Refund.

---

## Falha logística

ShipmentException.

↓

Fulfillment.

---

## Chargeback

Workflow próprio.

---

## Disputa

Workflow próprio.

---

## Extravio

ShipmentLost.

↓

Dispute.

---

# State Machine Oficial

```text
Created
      │
      ▼
PendingAcceptance
      │
      ▼
Accepted
      │
      ▼
Picking
      │
      ▼
Packing
      │
      ▼
ReadyToShip
      │
      ▼
Shipped
      │
      ▼
InTransit
      │
      ▼
Delivered
      │
      ▼
Completed
```

Estados alternativos

```text
Cancelled

RefundPending

Refunded

Disputed

Closed

Failed
```

Transições proibidas

Completed → Picking

Cancelled → Accepted

Refunded → Completed

Delivered → Picking

Shipped → Draft

---

# Regras de Negócio

## BR-001

Order somente nasce após PaymentApproved.

---

## BR-002

Todo Order possui Snapshot imutável.

---

## BR-003

Order nunca recalcula preços.

---

## BR-004

Toda transição deve respeitar a State Machine.

---

## BR-005

Nenhum Controller altera estado.

---

## BR-006

Somente Commands executam transições.

---

## BR-007

Todo estado gera Domain Event.

---

## BR-008

Pedidos concluídos são imutáveis.

---

## BR-009

Cancelamentos seguem políticas comerciais.

---

## BR-010

Toda alteração deve ser auditada.

---

## BR-011

O Snapshot do Order é imutável e representa a verdade histórica da venda, mesmo que Listings, preços ou dados do comprador sejam alterados posteriormente.

---

## BR-012

Pedidos contendo itens de múltiplas lojas devem originar múltiplos Orders independentes, um para cada Store, preservando isolamento operacional e financeiro.

---

# Permissões

Order.View

Order.Accept

Order.Cancel

Order.Pick

Order.Pack

Order.Ship

Order.Complete

Order.Admin

---

# Domain Policies

OrderCreationPolicy

CancellationPolicy

ShippingPolicy

CompletionPolicy

DisputeEligibilityPolicy

---

# Domain Services

OrderFactory

OrderValidationService

ShippingService

OrderCompletionService

---

# Eventos Emitidos

OrderCreated

OrderAccepted

OrderPickingStarted

OrderPacked

OrderReadyToShip

OrderShipped

OrderInTransit

OrderDelivered

OrderCompleted

OrderCancelled

OrderClosed

---

# Eventos Consumidos

PaymentApproved

ShipmentCreated

ShipmentDelivered

RefundCompleted

DisputeOpened

ChargebackOpened

---

# Compensações

Falha criação

↓

Rollback

↓

Nenhum evento publicado.

---

Falha envio

↓

Retry Worker.

---

Falha atualização

↓

Retry Projection.

---

# Background Processing

Dashboard.

Analytics.

Emails.

Push.

WebSockets.

Timeline.

Search.

Auditoria.

---

# Integrações

Supabase

Redis

Notification Service

Shipping Provider

Cloudflare

Event Bus

---

# SLA

SLA-001

Criar Order

≤ 2 segundos

---

SLA-002

Publicar OrderCreated

≤ 1 segundo

---

SLA-003

Atualizar Timeline

≤ 5 segundos

---

# Auditoria

Registrar

OrderId

PaymentId

CheckoutId

StoreId

BuyerId

CorrelationId

WorkflowId

Actor

Estado anterior

Estado novo

Timestamp

---

# Observabilidade

CorrelationId

WorkflowId

Latency

TransitionTime

RetryCount

ProjectionLag

---

# KPIs

KPI-001

Tempo até aceite.

---

KPI-002

Tempo de separação.

---

KPI-003

Tempo de envio.

---

KPI-004

Tempo até entrega.

---

KPI-005

Cancelamentos.

---

KPI-006

Disputas.

---

KPI-007

Pedidos concluídos.

---

# Anti Patterns

É proibido

Alterar Payment.

Recalcular preços.

Executar SQL direto.

Modificar Snapshot.

Executar HTTP durante Transaction.

Alterar estados pelo Controller.

Pular estados da máquina.

---

# Casos Extremos

Webhook duplicado.

Shipment perdido.

Chargeback após entrega.

Cancelamento simultâneo.

Retry.

Race Condition.

Falha logística.

---

# Implementação Esperada

```text
PaymentApproved Event

↓

Order Context

↓

CreateOrderCommand

↓

Validator

↓

Application Service

↓

OrderFactory

↓

Order Aggregate

↓

Repository

↓

Unit Of Work

↓

Persist Snapshot

↓

Persist Audit

↓

Persist Outbox

↓

Commit

↓

Event Bus

↓

Fulfillment Context

↓

Workers

↓

Dashboard

↓

Timeline Projection
```

---

# Dependências

payment.md

fulfillment.md

refunds.md

disputes.md

business-rules.md

permission-matrix.md

repository-pattern.md

unit-of-work.md

---

# Evolução

Versões futuras poderão incluir:

- Split Shipment.
- Multi Warehouse.
- Coleta em Loja.
- Retirada em Eventos.
- Entrega Parcial.
- Consolidação Inteligente.
- IA para previsão de atraso.
- SLA adaptativo.
- Auto resolução de problemas logísticos.

---

# Snapshot do Order

O Aggregate Order deve armazenar um snapshot completo e imutável contendo:

- Dados do comprador.
- Dados da Store.
- Listings adquiridas.
- Quantidades.
- Condições.
- Idioma.
- Finish.
- Preços unitários.
- Descontos.
- Frete.
- Taxas.
- Totais.
- Endereço de entrega.
- Método de pagamento.
- Dados fiscais necessários.

Esse snapshot representa a verdade histórica da transação.

---

# Relação com Payment

O Order nunca consulta Stripe.

Nunca consulta Gateway.

Nunca captura pagamentos.

Nunca altera Payment.

Toda comunicação financeira ocorre exclusivamente através de eventos publicados pelo Payment Context.

---

# Relação com Fulfillment

Após a criação do Order, a responsabilidade operacional é transferida ao Fulfillment Context.

O Fulfillment é responsável pelas atividades físicas:

- separação;
- conferência;
- embalagem;
- postagem;
- rastreamento;
- confirmação logística.

O Aggregate Order apenas acompanha os estados oficiais recebidos.

---

# Relação com Settlement

Após o estado `Completed`, o evento `OrderCompleted` inicia o workflow de Settlement.

O Settlement será responsável por:

- cálculo das comissões;
- retenções;
- repasses ao vendedor;
- conciliação financeira;
- geração de extratos.

O Aggregate Order não possui responsabilidade financeira após sua conclusão operacional.

---

# Regra Fundamental

O Order representa o contrato comercial oficial entre comprador e vendedor.

Ele nasce exclusivamente após `PaymentApproved`, mantém um snapshot histórico imutável da transação e evolui apenas através de sua State Machine oficial.

Nenhum componente da plataforma pode alterar diretamente seu estado, modificar seus valores históricos ou ignorar as regras de transição definidas pelo Aggregate `Order`.

Todas as mudanças devem ocorrer por meio de Commands, gerar Domain Events, respeitar auditoria completa e preservar a consistência do domínio.