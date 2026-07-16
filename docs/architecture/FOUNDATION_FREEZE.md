# Foundation Freeze — v0.2.0-foundation

**Tag:** `v0.2.0-foundation`  
**Data:** 2026-07-16  
**Status:** **FOUNDATION CLOSED** — próximo: Database Certification → PG contracts → wiring → Scryfall SHADOW  
**Escopo:** Fundação encerrada oficialmente (2026-07-16). Sem novos padrões arquiteturais até piloto Scryfall estável.

---

## 1. Revisão rápida de dependências entre domínios

### Cadeia permitida

```text
Catalog → Pricing → Marketplace → Search → Analytics
         ↘ Media ↗
Platform / shared  →  todos (transversal)
workers/           →  composition root (pode importar qualquer domínio)
```

### Matriz verificada no código (`services/api/src`)

| Módulo | Importa | Avaliação |
|--------|---------|-----------|
| `catalog/` | `platform`, `shared`, interno | OK |
| `pricing/` | só interfaces próprias | OK — sem Catalog/Marketplace |
| `media/` | `platform`, `shared` | OK |
| `marketplace/` | nenhum outro domínio | OK (RenderedCard self-contained) |
| `search/` | `platform`, `shared` | OK — não importa Catalog |
| `analytics/` | `platform`, `shared` | OK |
| `platform/` | `shared` (tipos de evento) | OK |
| `shared/` | nenhum domínio | OK |
| `workers/` | catalog, analytics, search, platform | OK — entrypoint |

### Débitos aceitos no freeze (código da tag)

| Item | Severidade | Nota |
|------|------------|------|
| `CatalogSyncService` publica direto no Event Bus | Alto | Substituir no incremento Outbox |
| Testes de fundação cruzam domínios | Baixo | Smoke aceitável |

---

## 2. Contratos públicos

### 2.1 Event Envelope (definitivo — EventMetadata)

```ts
{
  id?: string;
  eventType: DomainEventName;
  aggregateType: string;
  aggregateId: string;
  metadata: EventMetadata;  // ver §13.1
  payload: Record<string, unknown>;
}
```

`EventMetadata`: `requestId`, `traceId?`, `correlationId`, `causationId?`, `eventVersion`, `schemaVersion`, `projectionVersion?`, `producer?`, `occurredAt`.

| Campo | Quando muda |
|-------|-------------|
| `metadata.eventVersion` | Semântica muda (breaking para consumidores) |
| `metadata.schemaVersion` | Só o formato serializado do payload muda |

### 2.2 Domain Events (eventType)

`CardUpdated` · `SetUpdated` · `VariantUpdated` · `MediaUpdated` · `PriceUpdated` · `CurrencyUpdated` · `MarketplaceListingUpdated` · `ProviderHealthChanged`

### 2.3–2.9

CatalogProvider · PricingProvider · Provider Registry (cost/availability/success_rate) · Feature Flags · DTOs · Filas BullMQ · Media/RenderedCard — inalterados em espírito (ver tag + commits 1.2.x).

### 2.10 Schemas Fase 1

Migration tag: `20260723120000_domain_schemas_phase1.sql`  
Novas tabelas Outbox/offsets = **migrations novas**.

---

## 3. Fluxo transacional canônico

```text
Request
  → Application Service
    → TransactionManager.runInTransaction(tx => …)
    → Repository.upsert(tx, …)          // decisão da Application
    → OutboxRepository.insert(tx, …)    // decisão da Application (TM NÃO conhece Outbox)
    → COMMIT
  → Outbox Publisher (lease + SKIP LOCKED + claim_limit)
  → EventPublisher (port) → RedisPublisher (adapter)
  → Consumers (+ consumer_offsets)
```

**Proibido:** publish antes do commit.  
**Proibido:** `UPDATE` do `payload` no Outbox — correção = novo evento.  
**Proibido:** `TransactionManager` acoplado a Outbox / mensageria.

---

## 4. Outbox — leasing + DLQ + imutabilidade

### 4.1 Tabela `platform.outbox_events`

```text
id, aggregate_type, aggregate_id
event_name, event_version, schema_version
payload jsonb              -- IMUTÁVEL após INSERT
status                     -- pending | leased | published | dead
attempts, max_attempts
next_retry_at
lease_until, leased_by     -- leasing
published_at, created_at
request_id, trace_id
correlation_id, causation_id
projection_version
last_error
```

### 4.2 Leasing

```text
SELECT … FOR UPDATE SKIP LOCKED
  WHERE status = 'pending'
     OR (status = 'leased' AND lease_until < now())
→ status=leased, leased_by, lease_until
→ EventPublisher.publish(exact payload)
→ status=published
```

Worker morto → outro recupera após expirar o lease.

### 4.3 DLQ (`status = dead`)

```text
pending → leased → falha → retry… → (attempts >= max_attempts) → dead
```

Reprocessamento ops: `dead → pending` sem alterar payload.

### 4.4 EventPublisher (desacoplado de Redis)

```text
EventPublisher (interface)
  └── RedisPublisher (default)
  └── KafkaPublisher | NatsPublisher | RabbitPublisher (futuro)
```

### 4.5 Snapshot

O que está no Outbox é **exatamente** o que se publica. Sem mutação posterior.

---

## 5. Consumer offsets (+ métricas)

`platform.consumer_offsets`:

```text
consumer_name, event_id (PK)
processed_at
processing_duration_ms
result          -- success | skipped | failed
last_error
```

---

## 6. Ordem de construção

```text
1 Outbox ✓
2 TransactionManager + Repository ports ✓
3 Contratos pré-persistência (§12) ✓
4 Guard rails (§13): EventMetadata, Clock/Id/Hash ports, RepositoryResult, row_version, timeline  ✓
5 BullMQ Processors (adapters only)
6 Queue Producers
7 Smoke tests E2E (InMemory — Scheduler→Producer→BullMQ→Processor→AS)
8 Catalog Persistence (PostgreSQL)
9 Scryfall SHADOW
10 Validação de consistência
11 CANARY → LIVE
12+ Provider Certification → outros providers
13+ Media → Pricing → Search → Analytics
```

Índices `provider_mappings`: `(provider, provider_card_id)`, `(provider, provider_variant_id)`, `(catalog_card_id)`, `(catalog_variant_id)`.  
Pricing: `current_price_snapshot` + `price_history`.

---

## 7. Checklist operacional (pré Fase 3 Media)

- [ ] Migrations reversíveis
- [ ] Grafana: filas, providers, workers, outbox lag, outbox dead, consumer duration
- [ ] Health: API · Workers · Outbox Publisher
- [ ] Backup/restore testado
- [ ] Lease recovery testado
- [ ] Reprocessamento manual `dead`

### 7.1 Produção Outbox — previsto (não bloqueia TX/Repos)

| Item | Status | Nota |
|------|--------|------|
| **Backpressure** | Previsto | `claim_limit` (ex. 100) por ciclo — nunca SELECT sem LIMIT (já: `batchSize`) |
| **Heartbeat do lease** | Futuro | `heartbeat()` renova `lease_until` em lotes longos |
| **Poison payload** | Futuro | Erros de desserialização/schema → `dead` imediato (sem esgotar retries) |
| **Publish batch** | Futuro | claim N → publish batch → mark published batch (throughput) |

---

## 8. Checklist antes da primeira escrita real (Scryfall → DB)

- [ ] Transações corretas (`TransactionManager`)
- [ ] Outbox só após COMMIT (Application Service orquestra)
- [ ] Publisher idempotente + leasing + SKIP LOCKED
- [ ] Consumers idempotentes
- [ ] Recuperação após falha de worker
- [ ] Reprocessamento manual
- [ ] Métricas de lag do Outbox
- [ ] Health check do Publisher
- [ ] Payload imutável (teste)
- [ ] EventPublisher mockável sem Redis em unit tests
- [ ] Repositories por Aggregate Root + TxContext explícito
- [ ] Application Service = um Aggregate Root principal
- [ ] BullMQ = comandos (não Domain Events)
- [ ] Job Envelope padronizado
- [ ] Processors sem lógica de domínio
- [ ] Fronteira Scheduler ≠ Queue Producer ≠ Worker
- [ ] Máquina de estados de sync congelada
- [ ] Upsert Policy documentada (imutável / atualizável / evento)

---

## 9. Correlação (exemplo)

```text
SyncStarted     correlationId=C1  causationId=null
CardUpdated     correlationId=C1  causationId=<SyncStarted.id>
PriceUpdated    correlationId=C1  causationId=<CardUpdated.id>
ListingUpdated  correlationId=C1  causationId=<PriceUpdated.id>
```

---

## 10. Incremento Outbox — entregue (`5afe8a9c`)

| Artefato | Caminho |
|----------|---------|
| Migration | `supabase/migrations/20260723130000_platform_outbox.sql` |
| Envelope | `src/shared/events/types.ts` |
| OutboxRepository (PG + memory) | `src/platform/outbox/` |
| EventPublisher + Redis | `src/platform/event-publisher/` |
| Publisher process | `npm run worker:outbox` |
| Aceite (18 testes) | `src/platform/outbox/__tests__/outbox.acceptance.test.ts` |

---

## 11. TransactionManager + Repositories (regras congeladas)

### 11.1 TransactionManager **não** conhece Outbox

```text
Application Service
  → TransactionManager.begin() / runInTransaction(tx => …)
  → SetRepository.upsert(tx, …)
  → CatalogCardRepository.upsert(tx, …)
  → ProviderMappingRepository.upsert(tx, …)
  → OutboxRepository.insert(tx, …)   // decisão da Application Service
  → commit()
```

`TransactionManager` só controla a transação (begin/commit/rollback).  
Quem decide inserir eventos é a **camada de aplicação**.

### 11.2 Regras de Repository (congeladas)

1. **Um repository por Aggregate Root** (Card, Set, Variant, ProviderMapping).
2. **Sem** métodos genéricos `save(object)` / `update(any)`.
3. Interfaces **de domínio** (`CatalogCardRepository`, …), não de vendor.
4. Todo método de escrita recebe **`TxContext` explícito** — repository **não** abre conexão própria.
5. ScryfallProvider **não escreve** até TX + repos validados.
6. **Application Service dona de um Aggregate Root principal** (ver §12.7) — transações pequenas.

### 11.3 Ordem (pós-fundação)

```text
FOUNDATION CLOSED
↓
1 Database Certification          ← gate infra (migrations, SKIP LOCKED, budgets)
2 Persistence Contracts [Postgres]
3 Wiring adapters PostgreSQL
4 Scryfall SHADOW + ShadowComparison
5 ConsistencyValidator
6 CANARY → LIVE
7 Provider Certification → outros providers
```

**Proibido:** novos padrões arquiteturais até ciclo Scryfall operacional estável.

### 11.4 Entregue (TX + ports)

| Artefato | Caminho |
|----------|---------|
| TransactionManager + TxContext | `src/platform/transaction/` |
| Ports (Card/Set/Variant/ProviderMapping) | `src/catalog/domain/` |
| InMemory + Postgres adapters | `src/catalog/persistence/` |
| Application Services (Set/Card/Variant) | `src/catalog/application/` |
| Aceite TX | `src/platform/transaction/__tests__/transaction.acceptance.test.ts` |

### 11.5 Entregue (execução — processors / producers / smoke)

| Artefato | Caminho |
|----------|---------|
| JobEnvelope + InMemoryJobQueue | `src/platform/jobs/` |
| Sync*Command | `src/catalog/commands/` |
| Processors (adapters) | `src/catalog/processors/` |
| CatalogQueueProducer | `src/catalog/producers/` |
| CatalogSyncScheduler | `src/catalog/scheduler/` |
| Smoke E2E InMemory | `src/catalog/__tests__/smoke.e2e.inmemory.test.ts` |
| Persistence contracts | `src/catalog/persistence/__contracts__/` |
| SHADOW + Consistency | `src/catalog/validation/` |

**Ainda fora de escopo:** workers BullMQ+Redis ligados · Scryfall write · persistência LIVE.

---

## 12. Contratos pré-persistência (congelar antes de processors gravarem)

> Depois que processors começam a gravar, estes contratos ficam caros de mudar. Congelar agora.

### 12.1 Comando × Evento

| Canal | Carrega | Exemplos |
|-------|---------|----------|
| **BullMQ** | **Comandos** (trabalho a fazer) | `SyncSetCommand`, `SyncCardCommand`, `SyncVariantCommand` |
| **Event Bus** (via Outbox) | **Eventos** (fatos consumados) | `CardUpdated`, `SetUpdated`, `VariantUpdated` |

```text
BullMQ (SyncCardCommand)
  → Processor (adapter)
  → Application Service
  → Repositories + Outbox
  → COMMIT
  → Event Bus (CardUpdated)
```

**Proibido:** enfileirar `CardUpdated` (ou qualquer Domain Event) diretamente no BullMQ.  
BullMQ coordena trabalho; Event Bus comunica fatos.

### 12.2 Job Envelope (obrigatório em todo job)

```ts
{
  jobType: string;       // ex.: SyncCardCommand
  jobVersion: number;    // evolução do contrato do comando
  requestId: string;
  correlationId: string; // mesma jornada/sync
  providerId: string;
  gameCode: string;
  priority: "HIGH" | "NORMAL" | "LOW";
  attempt: number;       // tentativa atual (espelha BullMQ attempts quando possível)
  // + payload específico do comando (setCode, providerCardId, …)
}
```

Facilita retries, observabilidade e versionamento de contratos sem quebrar filas.

### 12.3 Processors sem lógica de domínio

O processor é **apenas adaptador**:

```text
BullMQ Processor
  → valida/deserializa Job Envelope
  → chama Application Service
  → (opcional) reporta métricas de infra
```

**Proibido no processor:** regras de sync, merge de campos, decisão de emitir evento, SQL, chamada direta a repository.

### 12.4 Scheduler ≠ Queue Producer ≠ Worker

```text
Cron / trigger
  → Scheduler          // decide O QUÊ e QUANDO sincronizar
  → Queue Producer     // monta Job Envelope + enqueue
  → BullMQ
  → Processor          // adapter → Application Service
```

Trocar o scheduler (cron Render, BullMQ repeatable, K8s CronJob) **não** exige alterar workers.

### 12.5 Máquina de estados da sincronização (job)

Caminho feliz:

```text
queued → running → completed
```

Caminho de falha:

```text
queued → running → failed → retry → (queued|running) …
                              ↓
                            dead
```

| Estado | Significado |
|--------|-------------|
| `queued` | Aceito na fila, aguardando worker |
| `running` | Processor em execução |
| `completed` | Application Service concluiu com sucesso |
| `failed` | Tentativa falhou (ainda há retry) |
| `retry` | Agendado para nova tentativa |
| `dead` | Esgotou tentativas / poison — intervenção ops |

Todos os processors de catálogo **devem** usar esta máquina (via BullMQ + tracking explícito quando houver tabela `sync_runs` / job execution). Sem estados ad hoc por processor.

### 12.6 Upsert Policy (Catalog)

Definir **antes** da primeira persistência real o que muda e o que gera evento.

#### `catalog_sets` (Aggregate: Set)

| Campo | Política |
|-------|----------|
| `id` | Imutável após create |
| `game_id`, `code` | Imutável (identidade natural) |
| `name`, `release_date` | Atualizável |
| Evento | `SetUpdated` **somente** se algum campo atualizável mudou |

#### `catalog_cards` (Aggregate: Card)

| Campo | Política |
|-------|----------|
| `id` | Imutável após create |
| `game_id` | Imutável |
| `set_id` | Atualizável só se corrigir vínculo oficial (raro; gera evento) |
| `name`, `normalized_name` | Atualizável (sync oficial vence) |
| `card_number`, `rarity`, `language` | Atualizável |
| `oracle_text`, `type_line`, `artist` | Atualizável |
| `game_data` (jsonb) | Atualizável por merge shallow de chaves conhecidas; chaves removidas pelo provider = update |
| Nova versão de carta | **Não** versionar linha: upsert in-place. Breaking de identidade → novo `id` + novo mapping (caso excepcional, ops) |
| Evento | `CardUpdated` **somente** se payload efetivo mudou (comparar hash/campos relevantes). No-op sync → **sem** Outbox |

#### `catalog_variants` (Aggregate: Variant)

| Campo | Política |
|-------|----------|
| `id` | Imutável |
| `card_id` | Imutável |
| `finish`, `language`, `is_foil`, `label` | Atualizável |
| `metadata` | Atualizável (mesma regra de `game_data`) |
| Evento | `VariantUpdated` só se mudou |

#### `provider_mappings` (Aggregate: ProviderMapping)

| Campo | Política |
|-------|----------|
| `id` | Imutável |
| `provider`, `provider_object_type`, provider_* ids | Imutáveis (identidade do mapping) |
| `catalog_*_id` | Atualizável só em remapeamento controlado |
| `metadata` | Atualizável |
| Evento | Em geral **não** emite Domain Event próprio; acompanha o evento do AR pai (`CardUpdated` / `SetUpdated`) quando o mapping é criado/alterado na mesma TX |

**Regra geral:** sync oficial **sempre vence** campos oficiais; nunca mesclar edição de lojista no Catalog.  
**Regra de evento:** sem diff → sem Outbox insert.

### 12.7 Application Service × Aggregate Root principal

Além de “um repository por AR”:

| Application Service | Aggregate Root principal | Pode tocar na mesma TX |
|---------------------|--------------------------|------------------------|
| `PersistCatalogSetApplicationService` | Set | `ProviderMapping` (tipo SET) + Outbox `SetUpdated` |
| `PersistCatalogCardApplicationService` | Card | `ProviderMapping` (tipo CARD) + Outbox `CardUpdated` |
| `PersistCatalogVariantApplicationService` | Variant | `ProviderMapping` (tipo VARIANT) + Outbox `VariantUpdated` |

**Proibido:** um único service “god” que persiste Set + Card + Variant na mesma transação em fluxo normal.  
Orquestração multi-AR fica no **comando de sync / orchestrator** (vários jobs / várias TXs), não numa mega-TX.

> Nota: o exemplo atual `PersistCatalogCardApplicationService` aceita `set?` opcional — na fase de persistência, Set deve ir para `PersistCatalogSetApplicationService` (job `SyncSetCommand` antes de cards).

### 12.8 Gate de providers

```text
Scryfall SHADOW estável + validação de consistência
  → CANARY → LIVE
  → Provider Certification ([PROVIDER_CERTIFICATION.md](./PROVIDER_CERTIFICATION.md))
  → só então novos providers (Pokémon, YGO, Bandai, …)
```

---

## 13. Guard rails (antes dos processors)

> Infra transversal pequena — barata agora, cara depois. Código em `src/shared/`.

### 13.1 EventMetadata

Objeto único para correlação / versão / tempo / producer — facilita Webhooks, Kafka, Replay, CDC, Auditoria sem alterar cada evento.

### 13.2 Clock Port

**Proibido** em domínio/aplicação: `new Date()` / `Date.now()`.  
Usar `Clock.now()` / `getClock()` (`SystemClock` | `FixedClock` em testes).

### 13.3 IdGenerator Port

**Proibido** em domínio/aplicação: `crypto.randomUUID()` direto.  
Usar `IdGenerator.generate()` (`UuidIdGenerator` | `SequentialIdGenerator` em testes).  
Troca futura para UUIDv7 sem tocar callers.

### 13.4 Hash Port

`HashPort.sha256` / `HashPort.perceptual` — evolução para xxHash / Murmur / BLAKE3 sem espalhar `createHash` no domínio.

### 13.5 RepositoryResult

```ts
{ outcome: "created" | "updated" | "unchanged"; entity; previousVersion; currentVersion }
```

Application Service **não** recalcula diff — usa `outcome` para decidir Outbox (`unchanged` → sem evento).

### 13.6 Versionamento otimista

Coluna `row_version` em aggregates de Catalog (+ `expectedVersion` no upsert).  
Migration: `20260723140000_guardrails_version_outbox_timeline.sql`.

### 13.7 Timeline do Outbox (quatro momentos)

| Momento | Onde |
|---------|------|
| `occurredAt` | `payload.metadata.occurredAt` (fato de domínio) |
| `committedAt` | `outbox_events.committed_at` (COMMIT / insert outbox) |
| `publishedAt` | `outbox_events.published_at` |
| `processedAt` | `consumer_offsets.processed_at` |

Grafana: latência commit · publisher · consumer · total.

### 13.8 Smoke antes do Postgres

```text
BullMQ Processors → Queue Producers → Smoke E2E (InMemory) → Persistência PG → Scryfall SHADOW
```

Validar Scheduler → Producer → BullMQ → Processor → Application Service **em memória** antes de ligar PostgreSQL.

### 13.9 Provider Certification

Após Scryfall LIVE: checklist em [`PROVIDER_CERTIFICATION.md`](./PROVIDER_CERTIFICATION.md) antes de qualquer novo provider.

---

## 14. Persistence Contract + SHADOW / CANARY gates

> Gate obrigatório **antes do primeiro INSERT real** em produção/piloto.

### 14.1 Repository Contract (congelado)

Todo adapter de Repository (InMemory hoje, Postgres agora, outro amanhã) **deve** passar:

| Cenário | Esperado |
|---------|----------|
| **Insert** | `outcome=created`, `row_version=1` |
| **Update** | `outcome=updated`, `row_version` incrementa |
| **No-op** | `outcome=unchanged`, versão estável |
| **Concurrency conflict** | `expectedVersion` errado → erro `optimistic_lock_failed` |
| **Rollback** | TX com throw descarta writes |
| **Idempotent retry** | mesmo upsert repetido → `unchanged` |

### 14.2 Persistence Contract Tests

```text
CatalogCardRepositoryContract / CatalogSetRepositoryContract
  → run(InMemory)     — sempre no CI
  → run(Postgres)     — quando CONTRACT_DATABASE_URL ou DATABASE_URL
  → mesmos asserts
```

Código: `src/catalog/persistence/__contracts__/`  
Comando: `npm run test:contracts`

**Proibido** promover wiring PG / Scryfall write sem contracts InMemory verdes.  
**Proibido** SHADOW com Postgres sem contracts PG verdes (mesmo suite).

### 14.3 SHADOW — tabela de comparação objetiva

| Métrica | Esperado |
|---------|----------|
| Sets sincronizados | 100% |
| Cards sincronizados | 100% |
| Variants sincronizadas | 100% |
| ProviderMappings | 100% |
| Eventos Outbox | = created+updated (não no-ops) |
| No-op rate (re-sync) | alto (≥ 95% após 1ª sync) |
| Divergências | 0 |

Implementação: `src/catalog/validation/ShadowComparison.ts` (`evaluateShadowComparison`).

### 14.4 Antes do CANARY — consistência automática

Rodar ao final de cada sync (e como gate CANARY):

- [ ] nenhuma carta sem set
- [ ] nenhum mapping órfão
- [ ] nenhuma variant órfã
- [ ] nenhum evento preso no Outbox (`pending`+`leased` = 0 após catch-up)
- [ ] nenhuma FK quebrada
- [ ] nenhuma imagem oficial apontando para listing
- [ ] nenhuma carta duplicada por provider mapping

Implementação: `src/catalog/validation/ConsistencyValidator.ts` + `CatalogConsistencyValidator`.

---

**Disciplina a preservar:** processors finos · AS orquestra · Outbox único caminho · smoke InMemory · **contracts PG = contracts InMemory** · SHADOW objetivo · consistency gate antes de CANARY.

---

## 15. Foundation Closed — gates operacionais

> **Fase de fundação encerrada oficialmente.**  
> Próximo ganho vem de certificação de banco, piloto Scryfall e métricas reais — não de novas camadas.

### 15.1 Database Certification

Antes do primeiro SHADOW com escrita: [`DATABASE_CERTIFICATION.md`](./DATABASE_CERTIFICATION.md).

```text
✓ migrations aplicam + rollback
✓ índices / constraints / FKs
✓ row_version
✓ SKIP LOCKED + lease Outbox
✓ performance mínima (budget)
```

Runner: `npm run certify:db` (exige `DATABASE_URL`).

Contracts validam **comportamento**; Database Certification valida **infraestrutura**.

### 15.2 Performance Budget (congelado)

| Operação | Budget |
|----------|--------|
| Persist Card | &lt; 20 ms |
| Persist Variant | &lt; 10 ms |
| Publish Outbox | &lt; 100 ms |
| Claim Outbox | &lt; 1 s |
| Search projection | &lt; 5 s |
| Shadow sync 10k cards | &lt; 30 min |

Código: `PERFORMANCE_BUDGET` em `src/platform/db/databaseCertification.ts`.  
Alterar budget = mudança consciente (PR + nota); não “ajuste silencioso”.

### 15.3 SLOs (observabilidade)

| Sinal | SLO |
|-------|-----|
| Outbox Lag (P95) | &lt; 30 s |
| Publisher success | ≥ 99,9% |
| Dead Events | 0 (exceto poison explícito) |
| Repository Contract | 100% verde no CI |
| Shadow Consistency | 100% (divergences = 0) |
| Consumers success | ≥ 99% |

Grafana acompanha estes números — não inventar painéis ad hoc sem mapear a um SLO.

### 15.4 ADRs

Decisões invioláveis em [`adr/`](./adr/README.md):

| ADR | Decisão |
|-----|---------|
| 001 | Catalog é Source of Truth |
| 002 | BullMQ = comandos |
| 003 | Marketplace = Overlay |
| 004 | Outbox obrigatório |
| 005 | AS por Aggregate Root |
| 006 | Provider Certification |

### 15.5 Foco pós-fundação

```text
1 Database Certification
2 Contracts Postgres verdes
3 Wiring PG
4 Scryfall SHADOW
5 Medição (budget + SLO + ShadowComparison + ConsistencyValidator)
6 CANARY → LIVE
```

**Evitar** novos padrões arquiteturais até o piloto Scryfall completar um ciclo operacional estável.

### 15.6 Roadmap produto + MVP

→ [`ROADMAP_90D.md`](./ROADMAP_90D.md)

**Meta 90 dias:** lojista anuncia carta MTG (Scryfall) → comprador busca e compra → ops monitora.  
**Agora:** Sprint 1 apenas (DB Cert → Contracts PG → Wiring → Scryfall SHADOW). Sem feature nova / sem outro TCG.
