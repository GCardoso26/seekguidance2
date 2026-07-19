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

Resolução: `JUDGE_TEST_ENV` → senão `APP_MODE` / `ENVIRONMENT` / `CI`.

### Regra fundamental — Beta

```bash
JUDGE_TEST_ENV=beta node testing/guards/assert-not-beta.mjs seed
# → exit 1 (sempre)
```

Não existem e **não devem existir**:

- `seed-beta`
- `cleanup-beta`

## Sexta camada: personas por TCG

```
testing/personas/
  core/          # Persona, behaviors, builders
  games/
    lorcana/     # Store Alpha, Competitive, Collector
    mtg/         # Commander Store, Competitive, Staples
    pokemon/
    onepiece/
    digimon/
    dragonball/
    riftbound/
    naruto/      # scaffold (datasetReady=false)
```

### Modelo comum

`Persona`: id, email, password, displayName, game, role, shop, inventory, wishlist, favorites, orders, cart, listings, behavior.

### Behaviors

`weeklyPublisher` | `competitiveSeller` | `casualSeller` | `collectorOnly` | `buyerOnly` | `hybrid`

### Aliases canônicos (Playwright)

| Alias | Persona default (Lorcana beachhead) |
|-------|-------------------------------------|
| `seller-alpha` | lorcana-store-alpha |
| `buyer-alpha` | lorcana-competitive-buyer |
| `collector-alpha` | lorcana-collector |

A suíte E2E reutiliza os **mesmos fluxos**; só muda o dataset do jogo.

## Fluxo de execução

```
Local → CI → Staging → Beta → Produção
  │       │       │       │        │
  seeds   seed-ci demo    ❌       ❌
  PW      PW+smoke PW     ❌       ❌
  free    personas demo   real     real
```

### Pipeline CI (testing)

```
seed-ci → seed-personas → smoke (read-only) → cleanup-ci
```

Workflow: `.github/workflows/testing-infra.yml`

### Seeds disponíveis

| Script | Ambiente |
|--------|----------|
| `testing/seed/seed-local.mjs` | local |
| `testing/seed/seed-ci.mjs` | ci |
| `testing/seed/seed-demo.mjs` | staging |
| `testing/seed/seed-personas.mjs` | local/ci/staging |
| `testing/seed/cleanup-ci.mjs` | ci |
| `testing/seed/cleanup-demo.mjs` | staging |

## Como adicionar um novo jogo (ex.: Naruto TCG)

1. Criar `testing/personas/games/<slug>/index.ts` com `GamePersonaPack`.
2. Se ainda não houver dataset: `datasetReady: false` (scaffold).
3. Registrar em `testing/personas/games/index.ts`.
4. **Não** reescrever specs Playwright — parametrizar pelo `game`.
5. Respeitar ADR-013 (allowlist) no **produto**; aqui só existe dataset de teste.

## Playwright

- Specs de produto permanecem em `frontend/runtime_console_v3/e2e/`.
- Bridge: `e2e/helpers/testing-bridge.ts` → personas.
- Referência: `testing/playwright/persona-flows.spec.ts`.
- `auth.setup.ts` e `seed:test` chamam o guard Beta.

### Fluxos obrigatórios (migração)

Seller: Login → Create listing → Edit → Update stock → Remove  
Buyer: Search → PDP → Offer → Cart → CheckoutSession CREATED  
Admin: Login → Dashboard → Moderar → Pedidos  
Smoke: health → search Rapunzel → PDP/offers → HTTP 200 (sem mutar DB)

## LPC / LCS / Sprint 8

- **Nenhuma** seed escreve em bancos que alimentam métricas de Beta/Prod.
- Guard falha se `JUDGE_TEST_ENV=beta` ou `APP_MODE=beta` / `production`.
- Sprint 8 permanece congelada; esta infra **não** é feature de produto.

## Comandos

```bash
# Guard
node testing/guards/assert-not-beta.mjs seed

# Seeds
node testing/seed/seed-local.mjs
node testing/seed/seed-ci.mjs
node testing/seed/seed-personas.mjs
node testing/seed/cleanup-ci.mjs

# Pipeline
node testing/seed/run-ci-pipeline.mjs

# Smoke
node testing/smoke/smoke-readonly.mjs

# FE lifecycle (já guarda beta)
cd frontend/runtime_console_v3 && npm run test:e2e:lifecycle
```
