# Architecture Decision Records (ADR)

Decisões congeladas da fundação JudgeTCG.  
**Não remover nem inverter sem novo ADR que supersede o anterior.**

Princípios permanentes (acima dos ADRs na Hierarchy of Truth): [`PLATFORM_CONSTITUTION.md`](../PLATFORM_CONSTITUTION.md).  
Débitos aceitos temporariamente: [`TECHNICAL_DEBT_REGISTER.md`](../TECHNICAL_DEBT_REGISTER.md).

| ADR | Título | Status |
|-----|--------|--------|
| [ADR-001](./ADR-001-catalog-source-of-truth.md) | Catalog é Source of Truth | Accepted |
| [ADR-002](./ADR-002-bullmq-commands-only.md) | BullMQ transporta comandos | Accepted |
| [ADR-003](./ADR-003-marketplace-overlay.md) | Marketplace usa Overlay (RenderedCard) | Accepted |
| [ADR-004](./ADR-004-outbox-mandatory.md) | Outbox obrigatório | Accepted |
| [ADR-005](./ADR-005-application-service-per-aggregate.md) | Application Service por Aggregate Root | Accepted |
| [ADR-006](./ADR-006-provider-certification.md) | Provider Certification | Accepted |
| [ADR-007](./ADR-007-marketplace-domain-boundaries.md) | Marketplace Domain Boundaries | Accepted |
| [ADR-008](./ADR-008-domain-event-contract.md) | Domain Event Contract | Accepted |
| [ADR-009](./ADR-009-idempotent-command-handlers.md) | Idempotent Command Handlers | Accepted |
| [ADR-010](./ADR-010-event-versioning.md) | Event Versioning | Accepted |
| [ADR-011](./ADR-011-public-api-boundaries.md) | Public API Boundaries | Accepted |
| [ADR-012](./ADR-012-lorcana-first-beachhead.md) | Lorcana-first Beachhead Strategy | Accepted |
| [ADR-013](./ADR-013-tcg-expansion-allowlist.md) | TCG Expansion Allowlist & Denylist | Accepted |
| [ADR-014](./ADR-014-testing-infrastructure-persona-composition.md) | Testing Infrastructure & Persona Composition | Accepted |
| [ADR-015](./ADR-015-architecture-freeze-product-first.md) | Architecture Freeze & Product-First Delivery | Accepted |
| [ADR-016](./ADR-016-tcg-hard-exit-and-packshot-allowlist.md) | TCG Hard-Exit Denylist & Packshot Allowlist Expansion | Accepted |
| [ADR-017](./ADR-017-object-storage-asset-platform.md) | Object Storage Próprio para a Asset Platform | Accepted |

### Processo de engenharia (pós-fundação)

- [Definition of Done](../../engineering/DEFINITION_OF_DONE.md)
- [RFC Process](../../engineering/RFC_PROCESS.md)
- [Release Train](../../engineering/RELEASE_TRAIN.md)
- [Checkout BC Epic](../CHECKOUT_BC_EPIC.md)

### Tríade R1 (mercado × escopo × engenharia)

| ADR | Pergunta |
|-----|----------|
| **012** | Qual mercado validamos primeiro? |
| **013** | Quais TCGs fazem parte oficialmente do ecossistema? |
| **014** | Como garantimos qualidade técnica sem contaminar o experimento de mercado? |

Formato: Context → Decision → Non-goals (quando aplicável) → Consequences → Future.
