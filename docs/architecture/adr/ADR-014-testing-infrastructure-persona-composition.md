# ADR-014 — Testing Infrastructure & Persona Composition

**Status:** Accepted  
**Data:** 2026-07-19  
**Tags:** testing, personas, qa, isolation, simulation  
**Relaciona:** [ADR-012](./ADR-012-lorcana-first-beachhead.md) · [ADR-013](./ADR-013-tcg-expansion-allowlist.md) · [`TESTING_ARCHITECTURE.md`](../../testing/TESTING_ARCHITECTURE.md) · [`NORTH_STAR_RELEASE_1.md`](../../product/NORTH_STAR_RELEASE_1.md)

> **Nota de numeração:** a sugestão verbal “ADR-013 — Testing…” colide com o ADR-013 já Accepted (TCG Expansion Allowlist). Esta decisão fica em **ADR-014**.

## Context

A suíte técnica cresceu (seeds, Playwright, personas multi-TCG, CI) em paralelo ao experimento de mercado do R1 (Lorcana-first, Sprint 8, LPC/LCS/SD).

Sem decisões explícitas, daqui a um ano a tendência é:

- misturar seeds/automação com Beta e contaminar North Star  
- duplicar comportamento por jogo (`LorcanaCompetitive`, `PokemonCompetitive`, …)  
- tratar TCS/PCS como Go/No-Go de produto  
- “simplificar” a pasta `testing/` sem entender o isolamento

Personas já evoluíram para **Arquétipo × Dataset**, com Behavior Profile, Simulation Layer e KPIs de engenharia (TCS/PCS). Isso precisa ficar congelado como invariante de infraestrutura — **não** como feature de produto.

## Decision

### 1. Personas = Arquétipo × Dataset

```
Competitive  ×  LorcanaDataset  →  Lorcana Competitive
Competitive  ×  PokemonDataset  →  Pokemon Competitive
```

- **Arquétipo** = *quem usa* (comportamento reutilizável: seller-large, competitive, collector, casual, buyer, …)  
- **Dataset / Catalog** = *o que usa* (cartas e pools por TCG em `testing/catalogs/`)  
- Novo TCG (ex.: Naruto) = novo catalog; comportamentos não são reescritos

### 2. Behavior Profile é parte da persona de teste

Além de credenciais e inventário, personas carregam perfil determinístico (`publishesPerWeek`, `returnsAfterDays`, `favoriteRarity`, idioma/condição/foil, `collectionFocus`, …).

Serve para cenários futuros (notificações, retenção, favoritos, recomendações, analytics técnicos) **sem** alterar o domínio de negócio.

### 3. Biblioteca de personas é independente do domínio de negócio

- Vive em `testing/` (archetypes, catalogs, scenarios, executors, analytics, reports)  
- **Não** cria bounded contexts de produto  
- **Não** altera contratos públicos nem ADRs de domínio (001–007)

### 4. Beta / Production nunca recebem seeds ou automação

Ambientes permitidos para seed, Playwright, personas e simulation: **local | ci | staging**.

Proibido:

- `seed-beta` / `cleanup-beta`  
- personas, Simulation Layer ou fixtures em Beta/Prod  
- qualquer escrita que alimente métricas reais de mercado

Guard fail-closed: `testing/guards/assert-not-beta.*`

### 5. Simulações são só validação técnica

A Simulation Layer (replay determinístico: N sellers → buyers → searches → carts → analytics esperado) valida Search, Projection, Inventory, Reservation e pipelines de analytics **isolados**.

- Sem IA / LLM obrigatório  
- **Jamais** alimenta LPC, LCS ou Supply Depth do North Star  
- Um “LPC esperado” derivado de simulation, se existir no futuro, é **métrica de sanity técnica**, não critério de Go/No-Go de produto

### 6. TCS e PCS são métricas de qualidade da engenharia

| KPI | Fórmula | Uso |
|-----|---------|-----|
| **TCS** | Fluxos Automatizados / Fluxos Definidos | Cobertura da suíte |
| **PCS** | Personas Exercitadas / Personas Existentes | Exercício multi-TCG |

**Não** são critérios de Go/No-Go do R1 / Sprint 8 / mercado.  
Baselines baixos (ex.: PCS centrado em Lorcana) são esperados até R2+.

### 7. Camadas de teste (referência)

Unit → Seed → E2E → Smoke → Founder Validation (ops) → Personas → **Simulation**

Founder Validation e North Star permanecem fora da contaminação por dados artificiais.

## Consequences

### Não altera

- ADR-012 (beachhead Lorcana)  
- ADR-013 (allowlist/denylist comercial)  
- North Star LPC/LCS/SD e experimento Sprint 8  
- Domínios e contratos de produto  

### Altera / congela

- Composição Archetype × Catalog como forma canônica de persona de teste  
- Isolamento absoluto Beta/Prod vs. automação  
- Interpretação de TCS/PCS como engenharia, não produto  
- Simulation Layer como 7ª camada técnica  

### Violação

Misturar simulation/seeds com métricas de Beta, ou duplicar comportamentos por TCG em vez de catalogs, é **desvio** deste ADR → corrigir ou propor supersede.

## Future (após R1 — backlog, não P0)

### Market Scenario

Compor mercados, não só usuários:

| Scenario | Mix (exemplo) |
|----------|----------------|
| Commander Night | 80% Competitive · 20% Collector |
| Lorcana Championship | 90% Competitive · 10% Collector |
| Colecionadores | Enchanted · Iconic · Promo |
| Pokémon Expansion Release | busca explode → oferta insuficiente → wishlist sobe |

Simulation deixa de executar apenas personas isoladas e passa a executar um **mercado sintético** determinístico.

### Sanity técnica de pipeline (não-North-Star)

```
Simulation → N buyers/sellers → Projection → Analytics → “LPC esperado” (técnico)
```

Esse sinal **nunca** entra no North Star nem no Go/No-Go de mercado.

Alterar isolation Beta, composição de personas, ou o papel de TCS/PCS/Simulation exige **ADR que supersede este**.
