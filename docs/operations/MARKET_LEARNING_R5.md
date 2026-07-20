# Release 5 — Market Learning

**Status:** Diretriz pós-Evidence Release (R4)  
**Tipo:** Release de **produto / aprendizado** — **não** é release de engenharia  
**Data:** 2026-07-20  
**Relaciona:** [EVIDENCE_RELEASE_R4.md](./EVIDENCE_RELEASE_R4.md) · [PLATFORM_CONSTITUTION.md](../architecture/PLATFORM_CONSTITUTION.md) · [MARKET_REVIEW_BOARD.md](./MARKET_REVIEW_BOARD.md) · [NORTH_STAR_RELEASE_1.md](../product/NORTH_STAR_RELEASE_1.md)

---

## Objetivo

**Aprender. Não construir.**

| Pergunta | Se… |
| --- | --- |
| Estamos resolvendo um **problema observado**? | Pode entrar |
| Estamos resolvendo um **problema imaginado**? | **Não entra** (Decision Quality) |

---

## Quatro entregas (somente)

### 1. Telemetria real

Substituir hipóteses por observação do funil (ex.: carta Rapunzel / watchlist):

busca → PDP → CTR → add cart → abandono → checkout

Tudo **observado** com usuários reais do Beta. Sem seeds. Sem simulation como prova.

### 2. Heatmaps / comportamento

- Quais filtros usam?
- Quais cartas procuram?
- Onde abandonam?
- Quanto tempo ficam?

Vale mais do que novas features de marketplace.

### 3. Founder Interviews

Template por loja / buyer:

| Campo | Conteúdo |
| --- | --- |
| Gostou | … |
| Odiou | … |
| Nunca usaria | … |
| Voltaria? | Sim / Não / Condicional |

Arquivo sugerido: `docs/operations/interviews/` (um MD por entrevista). **Não** alimentar North Star com opinião — usa-se no MRB como evidência qualitativa.

### 4. MRB baseado em dados

Fluxo ideal:

```text
evidência → decisão → roadmap
```

MRB deixa de ser só analítica antecipada e passa a **decidir** com telemetria + entrevistas + North Star.

---

## Fora de escopo do R5

- Novos providers / TCGs
- Novos bounded contexts
- Payment / SEO / IA / Social / Ranking / ERP / CSV
- “Melhorias” de arquitetura sem redução de incerteza

---

## Sequência

R3 Framework → R4 Evidence → **R5 Market Learning** → só então investimento de produto/engenharia justificado por problema observado.
