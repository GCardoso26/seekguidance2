# Testing Architecture — JudgeTCG

**Camada:** exclusivamente infraestrutura de testes  
**Fora do produto:** não altera domínio, contratos públicos, LPC, LCS, Supply Depth nem o experimento da Sprint 8.

## Filosofia

A infraestrutura de testes existe para responder **apenas** à validação técnica:

> O sistema funciona do login até o checkout?

A validação de mercado (LPC / LCS / Supply Depth / Beta Sprint 8) responde a outra pergunta:

> Um lojista real volta sozinho para publicar mais cartas e um comprador encontra sua oferta?

**Essas camadas nunca se misturam.** Dados artificiais (seeds, personas, Playwright) **jamais** entram em Beta ou Produção.

## Hierarchy of Truth (respeitada)

```
ADRs → North Star → MVP → Sprint → Ops → Código
```

Esta pasta `testing/` e `docs/testing/` **não** criam ADRs de produto, **não** alteram North Star R1, **não** tocam Sprint 8 congelada.

ADRs preservados (invariantes): ADR-001 … ADR-007, ADR-012, ADR-013.

**Decisão desta pasta:** [ADR-014 — Testing Infrastructure & Persona Composition](../architecture/adr/ADR-014-testing-infrastructure-persona-composition.md).

## Separação: técnica vs mercado

| Camada | Pergunta | Instrumentos | Dados |
|--------|----------|--------------|-------|
| Validação técnica | Sistema funciona? | Playwright, seeds, personas, CI | Artificiais / determinísticos |
| Validação de mercado | Há liquidez real? | Usuários reais, Beta S8, LPC, LCS, SD | **Somente reais** |

## Cinco ambientes

| Ambiente | Finalidade | Seed | Playwright | Personas | Analytics |
|----------|------------|------|------------|----------|-----------|
| **local** | Desenvolvimento | Livre | Sim | Sim | Off |
| **ci** | Testes automatizados | Personas determinísticas | Sim | Sim | Isolated-test |
| **staging** | Homologação | Demo | Sim | Sim | Demo-only |
| **beta** | Mercado (Sprint 8) | **Proibido** | **Proibido** | **Proibido** | Real users only |
| **production** | Operação | **Proibido** | **Proibido** | **Proibido** | Real users only |

Configuração: `testing/config/environments/{local,ci,staging,beta,production}.ts`

### Regra fundamental — Beta

```bash
JUDGE_TEST_ENV=beta node testing/guards/assert-not-beta.mjs seed
# → exit 1 (sempre)
```

Não existem e **não devem existir**: `seed-beta`, `cleanup-beta`.

## Domínio de infraestrutura (`testing/`)

```
testing/
  personas/
    archetypes/   # seller-large, competitive, collector, …
    core/         # types, builders, behaviors
    games/        # packs compostos (IDs estáveis / aliases)
    compose.ts    # archetype × catalog → Persona
  catalogs/       # datasets por jogo (lorcana, mtg, pokemon, …)
  fixtures/
  scenarios/      # Scenario → game → archetypes → flow → expect
  builders/
  executors/      # Simulation Layer (replay determinístico)
  analytics/      # TCS / PCS (KPIs de engenharia)
  reports/
  seed/ guards/ playwright/ smoke/ config/
```

Objetivo: executar

```
Scenario → Lorcana → Seller Large → Buyer Competitive → Checkout → Assertions
```

e depois `dataset = pokemon` **sem** alterar a suíte.

## Camadas de teste (7)

| # | Camada | Papel |
|---|--------|--------|
| 1 | Unit | Contratos isolados |
| 2 | Seed | Dados determinísticos local/ci/staging |
| 3 | E2E | Playwright lifecycle |
| 4 | Smoke | Read-only health/search/PDP |
| 5 | Founder Validation | Ops / mercado (fora de `testing/`) |
| 6 | Personas | Composição archetype × catalog |
| 7 | **Simulation** | Replay N sellers/buyers/searches/carts → analytics esperado (sem IA) |

## Composição de personas

```
archetypes/          catalogs/
  seller-large   ×     lorcana  →  Lorcana Store Alpha
  competitive    ×     lorcana  →  Lorcana Competitive
  competitive    ×     pokemon  →  Pokémon Competitive
  collector      ×     mtg      →  MTG Collector
```

Arquétipos: `seller-large` | `seller-small` | `collector` | `competitive` | `casual` | `buyer`

### Behavior Profile

Além de inventory / wishlist / orders / favorites:

`publishesPerWeek`, `averageListings`, `averageOrderValueCents`, `returnsAfterDays`, `favoriteRarity`, `preferredLanguage`, `preferredCondition`, `foilPreference`, `competitiveFormat`, `collectionFocus`

### Aliases canônicos (Playwright)

| Alias | Persona default (Lorcana beachhead) |
|-------|-------------------------------------|
| `seller-alpha` | lorcana-store-alpha |
| `buyer-alpha` | lorcana-competitive-buyer |
| `collector-alpha` | lorcana-collector |

## KPIs de engenharia (não são North Star)

```
TCS = Fluxos Automatizados / Fluxos Definidos
PCS = Personas Exercitadas / Personas Existentes
```

```bash
npm run test:coverage
# → testing/reports/coverage-latest.json
```

Úteis ao abrir Pokémon / MTG / Naruto sem confundir com LPC/LCS/SD.

## Simulation Layer (7ª)

```
50 sellers → 100 buyers → 1000 searches → 300 add-to-cart → analytics esperado
```

Sem IA / LLM. Replay determinístico em `testing/executors/simulation.ts`.

## Fluxo de execução

```
Local → CI → Staging → Beta → Produção
  │       │       │       │        │
  seeds   seed-ci demo    ❌       ❌
  PW      PW+smoke PW     ❌       ❌
  free    personas demo   real     real
```

Pipeline CI: `seed-ci → seed-personas → smoke → cleanup-ci`  
Workflow: `.github/workflows/testing-infra.yml`

## Como adicionar um novo jogo

1. Criar `testing/catalogs/<slug>.ts` (`GameCatalog`; scaffold com `datasetReady: false`).
2. Registrar em `testing/catalogs/index.ts` (+ overrides de IDs se necessário).
3. Criar `testing/personas/games/<slug>/index.ts` via `composeDefaultPack(...)`.
4. Registrar em `testing/personas/games/index.ts`.
5. **Não** reescrever specs — parametrizar `game` / scenario.
6. Produto: respeitar ADR-013 (allowlist); aqui só dataset de teste.

## Playwright

- Specs: `frontend/runtime_console_v3/e2e/`
- Bridge: `e2e/helpers/testing-bridge.ts`
- Guard Beta em `auth.setup.ts` e `seed:test`

### Fluxos obrigatórios

Seller: Login → Create listing → Edit → Update stock → Remove  
Buyer: Search → PDP → Offer → Cart → CheckoutSession CREATED  
Admin: Login → Dashboard → Moderação → Pedidos  
Smoke: health → search → PDP/offers → HTTP 200 (sem mutar DB)

## LPC / LCS / Sprint 8

- Nenhuma seed escreve em bancos que alimentam métricas de Beta/Prod.
- Guard falha se `JUDGE_TEST_ENV=beta` ou `APP_MODE=beta` / `production`.
- Sprint 8 permanece congelada; esta infra **não** é feature de produto.

## Backlog (não-P0 — pós-R1)

Já esboçado nesta pasta / ADR-014 Future:

- [x] Arquétipos reutilizáveis + composição
- [x] Behavior Profile
- [x] Scaffold Simulation Layer + TCS/PCS
- [x] ADR-014 (invariantes de isolamento e composição)
- [ ] **Market Scenario** (Commander Night, Championship, Expansion Release — mix de archetypes, não só usuários)
- [ ] Executor de scenarios ligado ao Playwright (param `dataset`)
- [ ] Simulation com HTTP/API real em ci (ainda in-memory)
- [ ] “LPC esperado” técnico via simulation (sanity de pipeline — **nunca** North Star)

## Comandos

```bash
node testing/guards/assert-not-beta.mjs seed
npm run seed:personas
npm run test:personas
npm run test:compose    # archetype × catalog
npm run test:coverage   # TCS / PCS
npm run test:infra:ci
cd frontend/runtime_console_v3 && npm run test:e2e:lifecycle
```
