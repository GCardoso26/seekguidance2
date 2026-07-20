# Platform Constitution — JudgeTCG

**Status:** Em vigor (pós-R3)  
**Tipo:** Constituição de plataforma — **não** é ADR, **não** é roadmap, **não** é Sprint Plan  
**Data:** 2026-07-20  
**Relaciona:** [ADRs](./adr/README.md) · [FOUNDATION_FREEZE.md](./FOUNDATION_FREEZE.md) · [North Star R1](../product/NORTH_STAR_RELEASE_1.md) · [TECHNICAL_DEBT_REGISTER.md](./TECHNICAL_DEBT_REGISTER.md) · [EVIDENCE_RELEASE_R4.md](../operations/EVIDENCE_RELEASE_R4.md) · [MARKET_LEARNING_R5.md](../operations/MARKET_LEARNING_R5.md) · [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md)

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

## Platform Freeze (pós-R3)

> A arquitetura-base está **congelada**. A partir daqui só evolui **mediante evidência**.

| Área | Estado | Evolui quando |
| --- | --- | --- |
| Foundation | **Frozen** | Evidência + ADR que supersede |
| Marketplace | **Frozen** | Evidência de mercado (Beta) + ADR se estrutural |
| Checkout | **Frozen** | Critério no [Debt Register](./TECHNICAL_DEBT_REGISTER.md) ou ADR |
| Catalog | **Frozen** | Provider Lifecycle + certification |
| Providers | **Frozen** | Expansion Playbook + certification (sem BC novo) |
| Testing | **Frozen** | ADR que supersede ADR-014 |
| Ops Framework | **Frozen** | Evidência operacional / MRB (sem dashboards de produto) |

**Congelado** ≠ “nunca mais tocamos código”. Significa: **sem feature creep**, sem novos bounded contexts, sem atalhos por jogo, sem reabrir fundação por preferência.

---

## O que nunca fazemos

1. Misturar **catálogo** e **marketplace** (ADR-001 / ADR-003 / ADR-007).
2. Colocar **preço** no catálogo.
3. Usar **seeds** em Beta / production (ADR-014).
4. Usar **métricas de engenharia** (TCS, PCS, readiness ops, health) como métricas de **produto** ou Go/No-Go de mercado.
5. Adicionar um TCG **sem** Provider Lifecycle (`Research` → … → Live / Beachhead).
6. Criar **exceções por jogo** (`if (game === …)` fora de `GameConfiguration` / módulo do provider).
7. Abrir Payment / SEO / IA / Chat / Social / Ranking / ERP / CSV **antes** de evidência de mercado que justifique.
8. Alterar North Star Release 1 ou ADRs 001–014 **in-place** para acomodar feature.
9. Construir features para **problemas imaginados** (Decision Quality).

---

## O que sempre fazemos

1. **Provider Certification** antes de LIVE (ADR-006).
2. **GameConfiguration** + **GameCapabilities** por jogo.
3. **Expansion Playbook** (Research + passos 1–10) para qualquer TCG novo.
4. **ADR** antes de mudança estrutural (domínio, SoT, allowlist, isolation Beta).
5. Separar **Engineering / Operations / Market / Business** nos relatórios ops.
6. Tratar débitos temporários no [Technical Debt Register](./TECHNICAL_DEBT_REGISTER.md).
7. Perguntar: **reduz incerteza?** e **problema observado?** — senão, **não entra**.
8. Manter [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md) gerado (`npm run test:ops-reports`) como porta de entrada do repo.

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
