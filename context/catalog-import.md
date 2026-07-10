# Catalog Import Workflow

> Workflow ID: WF-012
>
> Versão: 1.0
>
> Status: Oficial
>
> Owner: Marketplace Context
>
> Aggregate Root: ImportJob
>
> Bounded Context: Marketplace
>
> Dependências:
>
> - catalog-architecture.md
> - marketplace-architecture.md
> - listing-aggregate.md
> - inventory-aggregate.md
> - pricing-engine.md
> - background-jobs.md
> - order-lifecycle.md
> - business-rules.md
> - cqrs-pattern.md
> - unit-of-work.md
> - transaction-boundaries.md

---

# Objetivo

O Catalog Import Workflow permite que um vendedor utilize o Catálogo Global do JudgeTCG para criar anúncios (Listings) em sua loja de forma rápida, segura e auditável.

O processo nunca altera o Catálogo Global.

Ele apenas cria referências comerciais para cartas existentes.

O workflow é assíncrono, orientado a eventos e executado em background para suportar importações de grande volume.

---

# Filosofia

Catálogo Global

↓

Selecionar coleção (Expansion)

↓

Gerar Preview

↓

Usuário confirma

↓

Criar ImportJob

↓

Workers executam

↓

Criar Listings

↓

Atualizar Dashboard

↓

Import concluído

---

# Escopo

## Inclui

Importação por coleção.

Importação por jogo.

Importação por cartas selecionadas.

Preview.

Validação.

Criação de Listings.

Execução em background.

Auditoria.

---

## Não inclui

Criação de Cards.

Alteração do Catálogo Global.

Importação de preços.

Importação de estoque.

---

# Atores

Seller

Marketplace

Workers

Administrador

---

# Pré-condições

Loja ativa.

KYC aprovado (quando exigido).

Expansion publicada.

Catálogo sincronizado.

---

# Gatilhos

ImportExpansionCommand

ImportCardsCommand

BulkImportCommand

AdminImportCommand

---

# Entradas

StoreId

GameId

ExpansionId

CardIds

ImportOptions

CorrelationId

---

# Saídas

ImportJob criado.

Listings criados.

Eventos publicados.

Dashboard atualizado.

---

# Aggregate Principal

ImportJob

Responsável por:

- progresso;
- estado;
- auditoria;
- estatísticas;
- erros.

---

# Aggregates Relacionados

Listing

Inventory

Pricing

Catalog

Store

---

# Fluxo Principal

Selecionar expansão.

↓

Gerar Preview.

↓

Exibir quantidade de cartas.

↓

Usuário confirma.

↓

Criar ImportJob.

↓

Persistir.

↓

Commit.

↓

ImportRequested.

↓

Fila de Background.

↓

Workers criam Listings.

↓

Atualizar progresso.

↓

ImportCompleted.

↓

Atualizar Dashboard.

---

# Fluxos Alternativos

## Catálogo inexistente

Import rejeitado.

---

## Loja suspensa

Cancelar.

---

## Cartas já importadas

Ignorar ou atualizar conforme política configurável.

---

## Falha parcial

Registrar erros.

Continuar processamento.

---

## Falha total

ImportFailed.

---

# State Machine

```text
Created

↓

Queued

↓

Validating

↓

Processing

↓

Completed
```

Estados alternativos

```text
Cancelled

Failed

PartiallyCompleted

Expired
```

Transições proibidas

Completed → Processing

Cancelled → Processing

Failed → Processing

---

# Estratégias de Importação

## Expansion Import

Importa todas as cartas de uma coleção.

---

## Game Import

Importa todas as cartas de um jogo (uso administrativo).

---

## Card Selection

Importa apenas cartas selecionadas.

---

## Missing Listings

Cria apenas anúncios inexistentes.

---

## Replace Listings

Atualiza anúncios existentes conforme política.

---

# Preview

Antes da confirmação o sistema apresenta:

Quantidade de cartas.

Quantidade de anúncios novos.

Quantidade já existentes.

Tempo estimado.

Impacto esperado.

Possíveis conflitos.

Nenhuma alteração é persistida durante o Preview.

---

# Criação de Listings

Cada carta importada gera um Listing independente.

Inicialmente os campos comerciais permanecem vazios:

Preço.

Quantidade.

Idioma.

Condição.

Foil.

Observações.

O vendedor completa essas informações posteriormente.

---

# Regras de Negócio

## BR-001

Import nunca altera o Catálogo Global.

---

## BR-002

Toda carta referencia um Card existente.

---

## BR-003

Import é sempre assíncrono.

---

## BR-004

Import nunca ocorre dentro de uma única Transaction.

---

## BR-005

Listings são criados individualmente.

---

## BR-006

Falhas individuais não cancelam o ImportJob.

---

## BR-007

Todo Import possui auditoria.

---

## BR-008

Preview nunca persiste dados.

---

## BR-009

Import pode ser retomado após falha.

---

## BR-010

Import é idempotente.

---

# Permissões

Catalog.Import

Catalog.ImportBulk

Catalog.View

Catalog.Admin

---

# Domain Policies

ImportPolicy

DuplicatePolicy

ValidationPolicy

CatalogPolicy

MarketplacePolicy

---

# Domain Services

CatalogImportService

PreviewService

DuplicateDetectionService

ImportProgressService

ImportStatisticsService

---

# Eventos Emitidos

ImportRequested

ImportStarted

ListingCreated

ImportProgressUpdated

ImportCompleted

ImportFailed

ImportCancelled

---

# Eventos Consumidos

ExpansionPublished

CatalogUpdated

StoreApproved

---

# Compensações

Falha em uma carta

↓

Registrar erro.

↓

Continuar.

---

Falha Worker

↓

Retry.

---

Falha persistência

↓

Rollback da unidade atual.

---

# Background Processing

Fila de importação.

Atualização de progresso.

Notificações.

Analytics.

Reindexação.

---

# Integrações

Supabase

Redis

Cloudflare Queues

Event Bus

Search

Analytics

---

# SLA

Criar ImportJob

≤ 2 segundos

---

Início do processamento

≤ 30 segundos

---

Atualização de progresso

≤ 5 segundos

---

Conclusão

Dependente do volume importado

---

# Auditoria

Registrar

ImportJobId

StoreId

ExpansionId

Quantidade prevista

Quantidade criada

Quantidade ignorada

Quantidade com erro

CorrelationId

WorkflowId

Timestamp

---

# Observabilidade

QueueTime

ProcessingTime

CardsPerMinute

RetryCount

FailureRate

WorkerLatency

---

# KPIs

KPI-001

Tempo médio de importação.

---

KPI-002

Listings criados.

---

KPI-003

Falhas por importação.

---

KPI-004

Imports cancelados.

---

KPI-005

Cartas importadas por minuto.

---

# Anti Patterns

É proibido

Modificar o Catálogo Global.

Criar Cards durante importação.

Executar importação síncrona.

Criar milhares de Listings em uma única Transaction.

Executar SQL direto.

Bloquear a interface durante processamento.

---

# Casos Extremos

Coleções com dezenas de milhares de registros.

Importações simultâneas.

Reprocessamento após falha.

Atualização do catálogo durante importação.

Store suspensa durante execução.

Interrupção de Workers.

---

# Implementação Esperada

```text
Seller

↓

ImportExpansionCommand

↓

Application Service

↓

ImportJob Aggregate

↓

Repository

↓

Unit Of Work

↓

Persist

↓

Commit

↓

ImportRequested

↓

Queue

↓

Workers

↓

Listing Aggregate

↓

Repository

↓

Commit

↓

ListingCreated

↓

Projection

↓

Dashboard

↓

ImportCompleted
```

---

# Dependências

catalog-architecture.md

marketplace-architecture.md

listing-aggregate.md

inventory-aggregate.md

pricing-engine.md

background-jobs.md

business-rules.md

---

# Evolução

Versões futuras poderão incluir:

- Importação por CSV.
- Integração com coletores (ManaBox, Dragon Shield, Delver Lens etc.).
- Reconhecimento por OCR de listas.
- Importação por scanner de cartas.
- Sugestão automática de preços.
- IA para preenchimento de condição.
- Importação incremental.
- Templates de importação por loja.

---

# Relação com o Catálogo Global

O Catálogo Global permanece como a única fonte de verdade para cartas, expansões, idiomas, artistas, legalidades e demais metadados.

O Import Workflow nunca cria ou altera registros do catálogo, limitando-se à criação de Listings comerciais que referenciam essas entidades.

---

# Relação com Inventory

Após a criação dos Listings, o vendedor é responsável por informar estoque, condição, idioma e demais atributos comerciais.

O Inventory Context passa a controlar essas informações de forma independente do processo de importação.

---

# Regra Fundamental

O Catalog Import Workflow conecta o Catálogo Global ao Marketplace de forma segura, escalável e auditável.

Toda importação ocorre em background, é idempotente, orientada a eventos e cria exclusivamente Listings comerciais, preservando a separação entre o domínio de catálogo e o domínio de comércio do JudgeTCG.