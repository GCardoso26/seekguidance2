# ADR-015 — Architecture Freeze & Product-First Delivery

**Status:** Accepted  
**Data:** 2026-07-20  
**Tags:** governance, freeze, product, process

## Context

A fundação JudgeTCG está concluída e governada:

- Catalog, Assets, Pricing, Inventory, Marketplace (Orchestrator), Saga
- ADR-001…014 + Governance Pack (008–011)
- Outbox, CQRS, Feature Flags, Projection Worker, Architecture Tests
- Public API Boundaries

Adicionar mais camadas transversais agora tende a **aumentar complexidade** com **ganho marginal baixo** frente a entregar fluxos de negócio (Checkout, Orders, Notifications).

## Decision

1. **Congelar a arquitetura transversal.** Nenhum novo componente de plataforma (Event Store completo, Service Mesh, novos buses, etc.) sem **justificativa excepcional** + **RFC** + **nova ADR**.

2. **Prioridade = Produto.** Roadmap de épicos de negócio:

| Épico | Prioridade |
|-------|------------|
| Checkout BC | Muito alta |
| Orders BC | Muito alta |
| Notifications BC | Alta |
| Analytics BC | Alta |
| Search BC | Média |
| Identity BC | Média |
| Fulfillment BC | Média |

3. **Evolução estrutural** só via: RFC → discussão → ADR → implementação → testes → deploy.

4. **Checkout e demais BCs de negócio** consomem **apenas interfaces públicas** (`*/public.ts`, Saga, Outbox, FeatureFlags, DomainEventFactory). Zero SQL / repositórios de outros schemas.

5. **Definition of Done, RFC Process e Release Train** passam a ser regras de engenharia obrigatórias ([docs/engineering/](../../engineering/)).

## Non-goals

- Não implementar Event Sourcing integral, Service Mesh, K8s multi-serviço agora.
- Não reabrir ADRs 001–014 in-place.
- Não bloquear Checkout/Orders sob o “Platform Freeze” antigo — o freeze aplica-se à **fundação transversal**, não aos épicos de negócio listados.

## Consequences

- PRs de “mais infra por preferência” são rejeitados.
- Checkout BC é o **próximo desenvolvimento autorizado** (especificação em [`CHECKOUT_BC_EPIC.md`](../CHECKOUT_BC_EPIC.md)).
- Mudanças em Public API de um BC exigem atualização de `PUBLIC_API_BOUNDARIES.md` + testes de arquitetura.

## Declaration (formal)

> A fundação arquitetural do JudgeTCG está **concluída**. Novos desenvolvimentos devem priorizar capacidades de negócio (Checkout, Orders, Notifications, Analytics e Fulfillment), utilizando exclusivamente as interfaces públicas definidas pelos bounded contexts e respeitando as ADRs de governança. Mudanças estruturais na plataforma passam a exigir uma **RFC** e uma **nova ADR** antes da implementação.
