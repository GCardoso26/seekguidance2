# Listing Lifecycle Workflow

> Workflow ID: WF-002
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Marketplace Context
>
> Aggregate Root: Listing
>
> Bounded Context: Marketplace
>
> Dependências:
>
> - business-rules.md
> - marketplace-architecture.md
> - listing-aggregate.md
> - inventory-aggregate.md
> - pricing-engine.md
> - domain-event-contracts.md
> - permission-matrix.md
> - cqrs-pattern.md
> - repository-pattern.md
> - unit-of-work.md

---

# Objetivo

O Listing Lifecycle define todo o ciclo de vida de uma oferta comercial dentro do JudgeTCG.

Uma Listing representa a intenção de venda de um ativo pertencente a uma loja.

Ela conecta o Catálogo Global ao Marketplace.

O Workflow garante que toda Listing possua consistência comercial, rastreabilidade, versionamento e estados bem definidos.

---

# Escopo

## Inclui

Criação de Listing

Publicação

Atualização

Alteração de estoque

Alteração de preço

Pausa

Reativação

Arquivamento

Venda

Encerramento

---

## Não inclui

Pagamento

Pedido

Frete

Reputação

Disputa

KYC

Importação do catálogo global

---

# Atores

Store Owner

Manager

Employee

Marketplace

Workers

Sistema

---

# Pré-condições

Store ativa.

Store verificada.

Usuário autorizado.

Carta existente no Catálogo Global.

Inventory válido.

Preço válido.

Quantidade maior que zero.

Idioma permitido.

Condição permitida.

Finish permitido.

---

# Gatilhos

CreateListingCommand

UpdateListingCommand

PublishListingCommand

PauseListingCommand

ArchiveListingCommand

InventoryAdjusted

PriceUpdated

OrderCompleted

---

# Entradas

CardId

InventoryId

StoreId

Idioma

Condição

Finish

Preço

Quantidade

Observações

SKU opcional

Tags

---

# Saídas

Listing criada.

Listing publicada.

Eventos.

Atualização das projections.

Atualização da busca.

Atualização do dashboard.

---

# Aggregate Principal

Listing

O Aggregate Listing garante:

- integridade comercial;
- versionamento;
- consistência de estado;
- regras de publicação.

---

# Aggregates Relacionados

Inventory

Store

CatalogCard (somente leitura)

Pricing

---

# Fluxo Principal

Store inicia criação da Listing.

↓

Validar permissões.

↓

Validar Store.

↓

Validar Inventory.

↓

Validar Card.

↓

Validar preço.

↓

Validar quantidade.

↓

Criar Aggregate Listing.

↓

Persistir.

↓

Commit.

↓

Emitir ListingCreated.

↓

Caso solicitado

↓

Publish Listing.

↓

Validar elegibilidade.

↓

Atualizar estado.

↓

Commit.

↓

Emitir ListingPublished.

↓

Atualizar Search Projection.

↓

Atualizar Dashboard.

↓

Atualizar Marketplace Index.

---

# Fluxos Alternativos

## Estoque zerado

Listing permanece Draft.

---

## Carta inexistente

Erro.

---

## Store suspensa

Operação negada.

---

## Usuário sem permissão

Acesso negado.

---

## Concorrência

Version Conflict.

Retry permitido.

---

## Erro de persistência

Rollback.

---

# State Machine

```text
Draft
   │
   ▼
Ready
   │
   ▼
Published
   │
   ▼
Reserved
   │
   ▼
Sold
   │
   ▼
Completed
```

Estados alternativos

```text
Paused

Archived

Rejected

Expired

Deleted (soft delete)
```

Transições proibidas

Completed → Draft

Archived → Published

Deleted → Published

Sold → Draft

---

# Regras de Negócio

## BR-001

Toda Listing pertence exatamente a uma Store.

---

## BR-002

Toda Listing referencia exatamente um Asset do Catálogo Global.

---

## BR-003

Uma Listing nunca altera dados do Catálogo.

---

## BR-004

Preço deve ser maior que zero.

---

## BR-005

Quantidade deve ser positiva.

---

## BR-006

Uma Listing publicada deve possuir estoque disponível.

---

## BR-007

Listing pausada não participa das buscas.

---

## BR-008

Listing arquivada não pode ser reativada.

---

## BR-009

Alterações de preço geram nova versão.

---

## BR-010

Alterações de estoque geram evento.

---

## BR-011

Toda alteração deve ser auditada.

---

## BR-012

Soft Delete é obrigatório.

Nunca remover fisicamente uma Listing.

---

# Permissões

Listing.Create

Listing.Update

Listing.Publish

Listing.Pause

Listing.Archive

Listing.ChangePrice

Listing.ChangeInventory

Listing.Delete

---

# Domain Policies

ListingPublicationPolicy

PricingPolicy

InventoryPolicy

SellerEligibilityPolicy

MarketplacePolicy

---

# Domain Services

PricingService

InventoryValidationService

CatalogCompatibilityService

ListingPublicationService

---

# Eventos Emitidos

ListingCreated

ListingUpdated

ListingPublished

ListingPaused

ListingArchived

ListingPriceChanged

ListingInventoryChanged

ListingSold

ListingCompleted

ListingRemoved

---

# Eventos Consumidos

InventoryAdjusted

PriceCalculated

OrderCreated

OrderCancelled

OrderCompleted

StoreSuspended

StoreActivated

---

# Compensações

Falha durante publicação

↓

Rollback

↓

Nenhum evento publicado

---

Falha atualização de busca

↓

Retry Worker

---

Falha Analytics

↓

Retry Projection

---

# Background Processing

Atualizar Search

Atualizar Analytics

Atualizar Dashboard

Atualizar Cache

Atualizar Marketplace Feed

Reindexação

Notificações

---

# Integrações

Redis

Search Engine

Analytics

Cache

Cloudflare

Event Bus

---

# SLA

SLA-001

Criar Listing

≤ 2 segundos

---

SLA-002

Publicação

≤ 5 segundos

---

SLA-003

Atualização da busca

≤ 30 segundos

---

# Auditoria

Registrar

ListingId

InventoryId

StoreId

Actor

Operation

Version

CorrelationId

WorkflowId

Timestamp

Preço anterior

Preço novo

Quantidade anterior

Quantidade nova

---

# Observabilidade

CorrelationId

WorkflowId

Latency

RetryCount

ProjectionLag

CacheInvalidation

Version

---

# KPIs

KPI-001

Tempo médio para publicação.

---

KPI-002

Tempo médio entre criação e primeira venda.

---

KPI-003

Listings publicadas.

---

KPI-004

Listings pausadas.

---

KPI-005

Listings expiradas.

---

KPI-006

Tempo médio de atualização.

---

KPI-007

Taxa de conversão.

---

# Anti Patterns

É proibido

Modificar Catálogo.

Criar Listing sem Inventory.

Persistir diretamente pelo Controller.

Executar SQL no Application Service.

Executar HTTP durante Transaction.

Publicar antes do Commit.

Alterar preço diretamente no banco.

Excluir fisicamente.

Ignorar versionamento.

---

# Casos Extremos

Preço alterado simultaneamente.

Venda simultânea.

Inventory zerado durante Checkout.

Retry duplicado.

Webhook repetido.

Store suspensa durante venda.

Atualização concorrente.

---

# Implementação Esperada

```text
Controller

↓

CreateListingCommand

↓

Validator

↓

Application Service

↓

PricingService

↓

InventoryValidationService

↓

Listing Aggregate

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

Search Worker

↓

Analytics Projection

↓

Marketplace Projection

↓

Dashboard Projection
```

---

# Dependências

listing-aggregate.md

inventory-aggregate.md

pricing-engine.md

business-rules.md

permission-matrix.md

domain-event-contracts.md

cqrs-pattern.md

repository-pattern.md

unit-of-work.md

---

# Evolução

Versões futuras poderão incluir:

- Publicação agendada.
- Precificação automática por mercado.
- Ajuste automático por concorrência.
- Regras de estoque mínimo.
- Multi-warehouse.
- Promoções programadas.
- Campanhas por jogo.
- IA para sugestão de preço.
- Score de qualidade da Listing.
- Otimização automática para busca.

---

# Fluxo Resumido

```text
Store Ativa
      │
      ▼
Criar Listing
      │
      ▼
Validar Catálogo
      │
      ▼
Validar Inventory
      │
      ▼
Validar Pricing
      │
      ▼
Criar Aggregate
      │
      ▼
Commit
      │
      ▼
ListingCreated
      │
      ▼
Publish Listing
      │
      ▼
ListingPublished
      │
      ├────────► Search Projection
      ├────────► Analytics
      ├────────► Dashboard
      ├────────► Cache
      └────────► Marketplace Feed
```

# Relação com o Inventory Aggregate

O Listing **não é proprietário do estoque**.

O estoque pertence exclusivamente ao Aggregate **Inventory**.

A Listing apenas consulta a disponibilidade para determinar sua elegibilidade de publicação e venda.

Qualquer alteração de quantidade deve ocorrer através do Inventory Aggregate, que emitirá eventos (`InventoryAdjusted`, `InventoryDepleted`, `InventoryReplenished`) consumidos pelo workflow da Listing.

Essa separação garante que múltiplas Listings futuras (caso o modelo evolua para variações ou canais de venda) possam compartilhar o mesmo controle de inventário sem duplicação de estado.

---

# Relação com o Pricing Engine

O preço exibido pela Listing é resultado da aplicação das políticas do **Pricing Engine**.

O Aggregate Listing nunca executa cálculos financeiros complexos.

Sempre que houver alteração de preço, campanhas, descontos ou regras comerciais, o fluxo deverá utilizar o `PricingService`, persistir a nova versão da Listing e emitir `ListingPriceChanged`.

---

# Regra Fundamental

A Listing é a unidade comercial do JudgeTCG.

Ela representa uma oferta de venda vinculada a uma Store, referenciando um item do Catálogo Global e um Inventory existente.

Toda alteração de estado, preço ou disponibilidade deve passar obrigatoriamente pelo Aggregate `Listing`, respeitando versionamento, auditoria, políticas comerciais e emissão de eventos de domínio.

Nenhuma operação pode modificar uma Listing diretamente na persistência ou ignorar sua State Machine oficial.