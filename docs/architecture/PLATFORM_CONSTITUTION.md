# Platform Constitution — JudgeTCG

**Status:** Em vigor (pós-R3)  
**Tipo:** Constituição de plataforma — **não** é ADR, **não** é roadmap, **não** é Sprint Plan  
**Data:** 2026-07-20  
**Relaciona:** [ADRs](./adr/README.md) · [FOUNDATION_FREEZE.md](./FOUNDATION_FREEZE.md) · [North Star R1](../product/NORTH_STAR_RELEASE_1.md) · [Especificação Funcional](../product/PLATFORM_FUNCTIONAL_SPECIFICATION.md) · [TECHNICAL_DEBT_REGISTER.md](./TECHNICAL_DEBT_REGISTER.md) · [EVIDENCE_RELEASE_R4.md](../operations/EVIDENCE_RELEASE_R4.md) · [MARKET_LEARNING_R5.md](../operations/MARKET_LEARNING_R5.md) · [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md)

---

## Missão

O JudgeTCG existe para **reduzir o custo de entrada** de marketplaces especializados em TCG — via domínio claro, providers certificados e um framework de expansão previsível.

A infraestrutura aumenta a **probabilidade** de sucesso. Ela **não substitui** a validação de mercado (Onda 1 / Beta / North Star).

---

## Platform Guardian

Agentes e contribuidores atuam como **Platform Guardian**, não como implementadores de features por default.

Antes de qualquer alteração:

1. Validar esta Constituição.
2. Validar os ADRs.
3. Validar o North Star.
4. Verificar se existe **evidência operacional** que justifique a mudança.
5. Recusar alteração que aumente complexidade **sem** reduzir incerteza.

Nunca otimizar arquitetura só porque “parece melhor”.  
Nunca adicionar features para compensar ausência de liquidez.  
Nunca usar métricas de engenharia como substitutas das métricas de produto.

---

## Decision Quality

Sempre perguntar:

> Estamos resolvendo um **problema observado** ou um **problema imaginado**?

| Resposta | Ação |
| --- | --- |
| Observado (telemetria, entrevista, Beta, North Star) | Pode entrar no escopo |
| **Imaginado** | A feature **não entra** |

Complementa a pergunta do Evidence Release (“reduz incerteza?”).

---

## Hierarchy of Truth (completa)

```text
Platform Constitution
        ↓
      ADRs
        ↓
   North Star
        ↓
       MVP
        ↓
      Sprint
        ↓
       Ops
        ↓
     Código
```

| Conflito | Vence |
| --- | --- |
| Código vs ADR | ADR |
| Sprint vs North Star | North Star |
| Ops/métrica de engenharia vs North Star | North Star |
| Feature vs Constituição (“nunca fazemos”) | Constituição |
| Problema imaginado vs Observado | Observado (feature bloqueada) |
| Mudança estrutural sem ADR | **Bloqueada** |

ADRs **implementam** a Constituição. A Constituição **não supersede** ADRs já aceitos; se houver tensão, abre-se **novo ADR** (nunca editar ADR-001…014 in-place para “afrouxar” regras).

---

## Platform Freeze (pós-R3 / ADR-015)

> A **fundação transversal** está **congelada**. Evolução estrutural exige RFC + ADR.  
> **Épicos de negócio** (Checkout, Orders, Notifications, …) são a prioridade — ver [ADR-015](./adr/ADR-015-architecture-freeze-product-first.md).

| Área | Estado | Evolui quando |
| --- | --- | --- |
| Foundation / Governance | **Frozen** | Evidência excepcional + RFC + ADR |
| Marketplace (orquestrador) | **Frozen** (API pública só) | Evidência de mercado + ADR se estrutural |
| **Checkout** | ✅ **Done** | [CHECKOUT_BC_EPIC.md](./CHECKOUT_BC_EPIC.md) |
| **Orders** (+ Projections) | **Open — próximo épico** | [ORDERS_BC_EPIC.md](./ORDERS_BC_EPIC.md) |
| Notifications / Analytics | **Planned** | Após Orders; só eventos |
| Identity / Fulfillment | **Later** | Fulfillment consome `OrderPaid` |
| Catalog / Pricing / Inventory | **Frozen** (só Public API) | Provider Lifecycle / ADR |
| Testing / Ops Framework | **Frozen** | ADR que supersede |

**Congelado** ≠ “nunca tocamos código”. Significa: **sem novos componentes transversais**, sem feature creep de infra, sem reabrir fundação por preferência. Código de **negócio** avança via interfaces públicas.

---

## O que nunca fazemos

1. Misturar **catálogo** e **marketplace** (ADR-001 / ADR-003 / ADR-007).
2. Colocar **preço** no catálogo.
3. Usar **seeds** em Beta / production (ADR-014).
4. Usar **métricas de engenharia** (TCS, PCS, readiness ops, health) como métricas de **produto** ou Go/No-Go de mercado.
5. Adicionar um TCG **sem** Provider Lifecycle (`Research` → … → Live / Beachhead).
6. Criar **exceções por jogo** (`if (game === …)` fora de `GameConfiguration` / módulo do provider).
7. Abrir Payment / SEO / IA / Chat / Social / Ranking / ERP / CSV **antes** de evidência de mercado que justifique.
8. Alterar North Star Release 1 ou ADRs 001–015 **in-place** para acomodar feature.
9. Construir features para **problemas imaginados** (Decision Quality).
10. Adicionar **componente transversal** (Event Store integral, mesh, novo bus, etc.) **sem** RFC + ADR (ADR-015).
11. Acessar SQL/repositórios internos de outro BC a partir de Checkout/Orders (ADR-011).

---

## O que sempre fazemos

1. **Provider Certification** antes de LIVE (ADR-006).
2. **GameConfiguration** + **GameCapabilities** por jogo.
3. **Expansion Playbook** (Research + passos 1–10) para qualquer TCG novo.
4. **ADR** antes de mudança estrutural (domínio, SoT, allowlist, isolation Beta).
5. Separar **Engineering / Operations / Market / Business** nos relatórios ops.
6. Tratar débitos temporários no [Technical Debt Register](./TECHNICAL_DEBT_REGISTER.md).
7. Perguntar: **reduz incerteza?** e **problema observado?** — senão, **não entra**.
8. Respeitar **ADR-015**: produto primeiro; infra transversal só com RFC + ADR.
9. Cumprir [Definition of Done](../engineering/DEFINITION_OF_DONE.md) em todo PR.
10. Manter [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md) gerado (`npm run test:ops-reports`) como porta de entrada do repo.

---

## Maturidade técnica (avaliação de estágio — 2026-07-20)

Referência qualitativa para onboarding — **não** é KPI de produto:

| Área | Maturidade |
| --- | --- |
| Arquitetura de Domínio | 9.8 / 10 |
| Governança (ADRs + Lifecycle + Ops) | 9.9 / 10 |
| Testabilidade | 9.5 / 10 |
| Escalabilidade Multi-TCG | 9.4 / 10 |
| Operação / Observabilidade | 9.2 / 10 |
| **Prontidão de Mercado** | **Ainda depende do Beta** |

O item decisivo é o último: após o framework, a sequência é **Evidence (R4)** → **Market Learning (R5)** → só então produto/engenharia justificada por evidência.

---

## Emenda

Emendar esta Constituição exige:

1. Proposta escrita (MRB ou Founder Report).
2. ADR novo se a emenda afetar decisão já ADR’d.
3. Atualização explícita deste arquivo + link no Debt Register se criar débito aceito.

Não emendar por Sprint Plan.
