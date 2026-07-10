# Workflow Dependency Graph

> Documento Arquitetural
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Architecture
>
> Escopo: Plataforma JudgeTCG

---

# Objetivo

Este documento define o grafo oficial de dependências entre os Workflows, Bounded Contexts e Domain Events do JudgeTCG.

Seu objetivo é garantir:

- baixo acoplamento;
- alta coesão;
- independência entre Contexts;
- evolução segura da plataforma;
- implementação consistente pelos agentes de IA.

Este documento possui precedência sobre dependências implícitas encontradas no código.

---

# Princípios Arquiteturais

## 1. Toda dependência deve ser explícita

Nenhum Context pode depender implicitamente de outro.

Toda comunicação deve estar documentada.

---

## 2. O domínio é orientado a eventos

Sempre que possível:

```
A → Event → B
```

é preferível a

```
A → chamada direta → B
```

---

## 3. Dependências síncronas devem ser mínimas

Chamadas HTTP entre Contexts somente quando:

- consistência imediata é obrigatória;
- não existe alternativa orientada a eventos.

---

## 4. Read Models nunca são fonte de verdade

Somente Aggregates.

---

## 5. Cada Aggregate possui um único Owner.

Nenhum Aggregate pertence a mais de um Context.

---

# Visão Geral dos Bounded Contexts

```text
                    Global Catalog
                          │
                          ▼
                  Marketplace Context
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
      Pricing        Inventory        Checkout
          │               │                │
          └───────────────┼────────────────┘
                          ▼
                      Order Context
                          ▼
                    Payment Context
                          ▼
                  Fulfillment Context
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
      Refunds        Disputes       Settlement
          │               │                │
          └───────────────┼────────────────┘
                          ▼
                  Reputation Context
                          ▼
                  Moderation Context
                          ▼
                Notification Context

Todos os Contexts

↓

Background Jobs

↓

Analytics

↓

Search

↓

Read Models
```

---

# Camadas Arquiteturais

## Camada 1

Domínio

- Catalog
- Marketplace
- Orders
- Payment
- Fulfillment
- Settlement

---

## Camada 2

Governança

- Reputation
- Moderation
- Compliance
- Reviews

---

## Camada 3

Plataforma

- Notifications
- Background Jobs
- Search
- Analytics
- Scheduler

---

## Camada 4

Infraestrutura

- Redis
- Supabase
- Storage
- Queue
- SMTP
- Stripe
- Cloudflare

---

# Dependências por Workflow

## Seller Onboarding

Depende de

Store

KYC

Notifications

Background Jobs

---

## Listing Lifecycle

Depende de

Catalog

Inventory

Pricing

Search

Notifications

---

## Checkout

Depende de

Listing

Inventory

Pricing

Order

---

## Payment

Depende de

Order

Gateway

Settlement

Notifications

---

## Order Lifecycle

Depende de

Payment

Inventory

Fulfillment

Notifications

---

## Fulfillment

Depende de

Order

Shipping

Notifications

---

## Refund

Depende de

Payment

Order

Settlement

Notifications

---

## Disputes

Depende de

Refund

Order

Moderation

Reputation

---

## Reputation

Depende de

Orders

Refunds

Disputes

Moderation

Reviews

---

## Moderation

Depende de

Reports

Disputes

Compliance

Reputation

---

## Notifications

Consome eventos de todos os Contexts.

Nunca é chamado diretamente.

---

## Catalog Import

Depende de

Catalog

Marketplace

Inventory

Background Jobs

---

## Background Jobs

Consome Domain Events.

Nunca executa regras de negócio.

---

## Disaster Recovery

Depende de

Outbox

Workers

Replay

Reconciliação

---

# Grafo Oficial de Eventos

## Catalog

Publica

CardCreated

ExpansionPublished

CatalogUpdated

---

## Marketplace

Publica

ListingCreated

ListingUpdated

ListingRemoved

InventoryUpdated

PriceChanged

---

## Checkout

Publica

CheckoutStarted

CheckoutCompleted

---

## Order

Publica

OrderCreated

OrderConfirmed

OrderCancelled

OrderCompleted

---

## Payment

Publica

PaymentAuthorized

PaymentCaptured

PaymentFailed

ChargebackOpened

---

## Fulfillment

Publica

ShipmentCreated

ShipmentPosted

ShipmentDelivered

---

## Refund

Publica

RefundRequested

RefundApproved

RefundCompleted

---

## Settlement

Publica

SettlementReleased

SettlementBlocked

SettlementReconciled

---

## Reputation

Publica

ReputationUpdated

SellerLevelChanged

---

## Moderation

Publica

ModerationDecisionMade

StoreSuspensionRequested

ListingRemovalRequested

---

## Notifications

Publica

NotificationSent

NotificationDelivered

NotificationRead

---

# Matriz de Dependências

| Context | Sync | Async |
|----------|------|-------|
| Catalog | — | Marketplace |
| Marketplace | Catalog | Orders |
| Orders | Marketplace | Payment |
| Payment | Orders | Settlement |
| Fulfillment | Orders | Notifications |
| Refund | Payment | Reputation |
| Dispute | Refund | Moderation |
| Moderation | Compliance | Notifications |
| Reputation | Orders | Notifications |
| Notifications | — | Todos |

---

# Dependências Proibidas

Catalog → Payment

Catalog → Orders

Catalog → Notifications

Catalog → Refund

Catalog → Settlement

---

Payment → Catalog

---

Payment → Inventory

---

Notifications → Orders

Notifications → Payment

Notifications → Inventory

Notifications → Catalog

---

Search → Payment

---

Analytics → Orders (escrita)

Analytics → Payment (escrita)

---

Read Models → Aggregates

---

Reviews → Payment

---

Reputation → Payment

---

Moderation → Payment

---

# Dependências Permitidas

Catalog → Marketplace

Marketplace → Pricing

Marketplace → Inventory

Checkout → Order

Order → Payment

Payment → Settlement

Order → Fulfillment

Refund → Settlement

Dispute → Moderation

Moderation → Notification (via evento)

Todos → Background Jobs

Todos → Analytics (via evento)

Todos → Search (via evento)

---

# Comunicação Oficial

## Síncrona

Application Service

↓

Aggregate

↓

Repository

↓

Commit

---

## Assíncrona

Commit

↓

Outbox

↓

Event Bus

↓

Workers

↓

Consumers

---

# Direção das Dependências

Todas as dependências devem seguir:

```text
Domínio

↓

Governança

↓

Plataforma

↓

Infraestrutura
```

Nunca o contrário.

---

# Fluxo Completo do Marketplace

```text
Catalog

↓

Listing

↓

Inventory

↓

Checkout

↓

Order

↓

Payment

↓

Fulfillment

↓

Settlement

↓

Refund

↓

Dispute

↓

Moderation

↓

Reputation

↓

Notification
```

---

# Fluxos Paralelos

Em paralelo ao fluxo principal:

Analytics

Search

Projection

Dashboard

Audit

Workers

Todos são alimentados exclusivamente por eventos.

---

# Regras Arquiteturais

## RA-001

Nenhum Context acessa tabelas privadas de outro Context.

---

## RA-002

Nenhum Aggregate conhece outro Aggregate por referência direta.

Somente IDs.

---

## RA-003

Eventos são imutáveis.

---

## RA-004

Read Models podem ser descartados e reconstruídos.

---

## RA-005

Todo Workflow publica eventos apenas após Commit.

---

## RA-006

Todo Consumer deve ser idempotente.

---

## RA-007

Background Jobs nunca executam antes do Commit.

---

## RA-008

Dependências circulares são proibidas.

---

## RA-009

Toda integração externa deve ocorrer fora da Transaction.

---

## RA-010

Toda dependência nova deve ser adicionada a este documento antes da implementação.

---

# Checklist Arquitetural

Antes de criar qualquer funcionalidade nova, verificar:

- Existe um Aggregate Owner?
- Existe um Workflow?
- Existe um Domain Event?
- Existe uma Transaction Boundary?
- Existe um Consumer?
- Existe Replay?
- Existe Idempotência?
- Existe Auditoria?
- Existe Observabilidade?
- Existe documentação neste grafo?

Se qualquer resposta for "não", a implementação não deve prosseguir.

---

# Evolução

Versões futuras poderão incluir:

- Grafo visual em Mermaid.
- Geração automática a partir dos contratos de eventos.
- Validação automática de dependências no CI/CD.
- Detecção de ciclos arquiteturais.
- Métricas de acoplamento entre Contexts.
- Catálogo navegável de produtores e consumidores de eventos.

---

# Regra Fundamental

O Workflow Dependency Graph é a representação oficial das dependências do JudgeTCG.

Toda comunicação entre Contexts deve respeitar este grafo, utilizando chamadas síncronas apenas quando estritamente necessário e privilegiando Domain Events, Background Jobs e processamento assíncrono para manter a plataforma escalável, resiliente e fracamente acoplada.