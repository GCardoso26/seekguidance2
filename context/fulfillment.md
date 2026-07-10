# Fulfillment Workflow

> Workflow ID: WF-006
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Fulfillment Context
>
> Aggregate Root: Fulfillment
>
> Bounded Context: Fulfillment
>
> Dependências:
>
> - order-lifecycle.md
> - payment.md
> - refunds.md
> - disputes.md
> - marketplace-architecture.md
> - business-rules.md
> - permission-matrix.md
> - cqrs-pattern.md
> - transaction-boundaries.md
> - unit-of-work.md
> - domain-event-contracts.md

---

# Objetivo

O Fulfillment Workflow é responsável pela execução operacional de um Order após sua criação.

Seu papel é transformar um pedido pago em um pedido entregue, controlando todas as etapas físicas da operação.

O Fulfillment nunca cria Orders.

O Fulfillment nunca captura pagamentos.

O Fulfillment apenas executa a operação logística.

---

# Filosofia

Order cria o contrato.

↓

Fulfillment executa o contrato.

↓

Shipment movimenta a mercadoria.

↓

Delivery confirma.

↓

Settlement libera recursos.

---

# Escopo

## Inclui

Aceite operacional.

Separação (Picking).

Conferência.

Embalagem (Packing).

Geração de etiqueta.

Postagem.

Rastreamento.

Entrega.

Falhas logísticas.

Extravio.

Devolução.

---

## Não inclui

Pagamento.

Checkout.

Order Creation.

Reembolso financeiro.

Repasse.

Reputação.

---

# Modelos de Fulfillment

O JudgeTCG suporta múltiplos modelos logísticos.

## Seller Fulfillment

O vendedor realiza todas as etapas.

---

## Marketplace Fulfillment (Futuro)

O JudgeTCG opera centros logísticos próprios.

---

## Híbrido

Parte da operação é executada pelo vendedor e parte pelo marketplace.

---

## Eventos Presenciais (Futuro)

Entrega presencial em torneios ou eventos oficiais.

---

# Atores

Seller

Operador

Marketplace

Transportadora

Buyer

Workers

Administrador

---

# Pré-condições

Order criado.

Order pago.

Order aceito.

Endereço válido.

Método de envio definido.

---

# Gatilhos

OrderAccepted

CreateShipmentCommand

PrintLabelCommand

ConfirmPickingCommand

ConfirmPackingCommand

ConfirmShipmentCommand

CarrierWebhookReceived

DeliveryConfirmed

---

# Entradas

OrderId

StoreId

Carrier

TrackingNumber

Volumes

Peso

Dimensões

Etiqueta

Observações

CorrelationId

---

# Saídas

Fulfillment criado.

Shipment criado.

Eventos.

Atualização operacional.

Timeline.

Notificações.

---

# Aggregate Principal

Fulfillment

Responsável por:

- execução logística;
- conferência operacional;
- rastreabilidade;
- estados de operação;
- auditoria.

---

# Aggregates Relacionados

Order

Shipment

Inventory

Return

Dispute

Settlement

---

# Fluxo Principal

Receber OrderAccepted.

↓

Criar Fulfillment.

↓

Iniciar Picking.

↓

Confirmar Picking.

↓

Packing.

↓

Conferência.

↓

Gerar etiqueta.

↓

Criar Shipment.

↓

Postar encomenda.

↓

Receber Tracking.

↓

Atualizar rastreamento.

↓

Confirmar entrega.

↓

Emitir FulfillmentCompleted.

↓

OrderCompleted.

---

# Fluxos Alternativos

## Item não localizado

PickingException.

↓

Nova tentativa.

↓

Escalar operador.

---

## Produto danificado

Cancelar Fulfillment.

↓

Refund Workflow.

---

## Etiqueta inválida

Regenerar.

---

## Transportadora indisponível

Selecionar nova opção.

---

## Extravio

ShipmentLost.

↓

Dispute Workflow.

---

## Buyer recusou entrega

Return Workflow.

---

# State Machine

```text
Pending
      │
      ▼
Picking
      │
      ▼
Picked
      │
      ▼
Packing
      │
      ▼
Packed
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
Delayed

Lost

Returned

Cancelled

Exception

Failed
```

Transições proibidas

Completed → Picking

Packed → Pending

Delivered → Packing

Lost → Delivered

Returned → Delivered

---

# Regras de Negócio

## BR-001

Fulfillment inicia apenas após OrderAccepted.

---

## BR-002

Picking deve ser confirmado antes do Packing.

---

## BR-003

Packing deve ser concluído antes da geração da etiqueta.

---

## BR-004

Shipment somente pode ser criado após Packing concluído.

---

## BR-005

Tracking deve ser único.

---

## BR-006

Toda alteração gera auditoria.

---

## BR-007

Entrega somente pode ser confirmada por evento logístico ou confirmação manual autorizada.

---

## BR-008

Extravio inicia automaticamente análise para disputa.

---

## BR-009

Falhas logísticas nunca alteram diretamente o Aggregate Payment.

---

## BR-010

O Fulfillment deve operar de forma idempotente em todas as integrações com transportadoras.

---

# Permissões

Fulfillment.View

Fulfillment.Pick

Fulfillment.Pack

Fulfillment.PrintLabel

Fulfillment.Ship

Fulfillment.Cancel

Fulfillment.Override

---

# Domain Policies

FulfillmentPolicy

ShippingPolicy

CarrierSelectionPolicy

PackagingPolicy

DeliveryConfirmationPolicy

---

# Domain Services

FulfillmentService

PickingService

PackingService

ShippingLabelService

TrackingService

CarrierService

---

# Eventos Emitidos

FulfillmentCreated

PickingStarted

PickingCompleted

PackingStarted

PackingCompleted

ShippingLabelGenerated

ShipmentCreated

ShipmentPosted

ShipmentTrackingUpdated

ShipmentDelivered

FulfillmentCompleted

ShipmentExceptionOccurred

ShipmentLost

ShipmentReturned

---

# Eventos Consumidos

OrderAccepted

CarrierWebhookReceived

TrackingUpdated

DeliveryConfirmed

ReturnApproved

---

# Compensações

Falha ao gerar etiqueta

↓

Retry.

↓

Nova transportadora.

---

Falha na postagem

↓

Cancelar Shipment.

↓

Gerar nova etiqueta.

---

Extravio

↓

Abrir investigação.

↓

Notificar Buyer e Seller.

---

# Background Processing

Atualização automática de rastreamento.

Reindexação do Timeline.

Notificações.

Dashboard operacional.

Analytics.

Métricas de SLA.

Sincronização com transportadoras.

---

# Integrações

Correios

Melhor Envio

Jadlog

Loggi

Cloudflare

Redis

Supabase

Event Bus

---

# SLA

SLA-001

Iniciar Picking

≤ 4 horas após aceite.

---

SLA-002

Packing

≤ 24 horas.

---

SLA-003

Postagem

≤ 48 horas.

---

SLA-004

Atualização de Tracking

≤ 5 minutos após webhook.

---

# Auditoria

Registrar

FulfillmentId

OrderId

ShipmentId

StoreId

Actor

Carrier

Tracking

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

CarrierLatency

TrackingLatency

RetryCount

FulfillmentDuration

---

# KPIs

KPI-001

Tempo médio de Picking.

---

KPI-002

Tempo médio de Packing.

---

KPI-003

Tempo médio até postagem.

---

KPI-004

Tempo médio de entrega.

---

KPI-005

Pedidos atrasados.

---

KPI-006

Extravios.

---

KPI-007

Retornos.

---

# Anti Patterns

É proibido

Alterar Payment.

Modificar Order diretamente.

Executar lógica financeira.

Criar Shipment sem Packing.

Atualizar Tracking manualmente sem auditoria.

Ignorar webhooks da transportadora.

Executar integrações externas durante Transaction.

---

# Casos Extremos

Tracking duplicado.

Transportadora envia eventos fora de ordem.

Extravio.

Entrega parcial.

Pacote devolvido.

Troca de transportadora.

Múltiplas tentativas de entrega.

---

# Implementação Esperada

```text
OrderAccepted Event

↓

Fulfillment Context

↓

CreateFulfillmentCommand

↓

Application Service

↓

Fulfillment Aggregate

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

Carrier Service

↓

Shipment Aggregate

↓

Carrier Webhooks

↓

Fulfillment Aggregate

↓

Commit

↓

FulfillmentCompleted

↓

Order Context
```

---

# Dependências

order-lifecycle.md

refunds.md

disputes.md

business-rules.md

permission-matrix.md

transaction-boundaries.md

unit-of-work.md

---

# Evolução

Versões futuras poderão incluir:

- Fullfilment próprio do JudgeTCG.
- Multi Warehouse.
- Estoque distribuído.
- Consolidação automática de envios.
- Coleta agendada.
- Lockers inteligentes.
- Entrega em eventos oficiais.
- IA para previsão de atraso.
- Seleção dinâmica de transportadora baseada em SLA e custo.
- Picking otimizado por rotas.

---

# Relação com Shipment

O Shipment representa exclusivamente o transporte físico da encomenda.

O Fulfillment coordena todo o processo operacional e utiliza o Shipment como componente responsável pela movimentação logística.

Um Fulfillment pode originar um ou mais Shipments em futuras evoluções da plataforma (split shipment).

---

# Relação com Order

O Aggregate Order permanece como a autoridade sobre o contrato comercial.

O Fulfillment apenas informa eventos operacionais (`ShipmentPosted`, `ShipmentDelivered`, `FulfillmentCompleted`) que são consumidos pelo Order Context para realizar transições válidas da State Machine.

---

# Relação com Settlement

A conclusão do Fulfillment (`FulfillmentCompleted`) é um dos sinais utilizados pelo Settlement Context para verificar se os critérios de liberação financeira foram atendidos.

A política de retenção poderá considerar:

- confirmação de entrega;
- prazo de contestação;
- inexistência de disputa;
- inexistência de chargeback.

O Fulfillment nunca realiza repasses financeiros.

---

# Regra Fundamental

O Fulfillment representa a execução física do contrato comercial estabelecido pelo Order.

Toda operação logística deve ocorrer através do Aggregate `Fulfillment`, respeitando sua State Machine, garantindo rastreabilidade completa, auditoria, idempotência e integração assíncrona com transportadoras.

Nenhum componente da plataforma pode alterar diretamente o estado operacional de uma entrega sem passar pelas regras definidas neste workflow.