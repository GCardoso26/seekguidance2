# Expansion Playbook — adicionar um novo TCG

Consolida o que hoje está em ADR-006, ADR-012/013, `ProviderLifecycle`, certificação e código de providers. Objetivo: **novo jogo sem alterar arquitetura** — só módulos plugáveis.

## Pré-requisitos

- ADR de allowlist (tier R3/R4) aprovado no MRB.
- Factory key nova em `CatalogProviderFactory` — sem `if (game === …)` no domínio Seller/Buyer.

## Passos

| # | Entrega | Onde | Critério de saída |
| --- | --- | --- | --- |
| 0 | **Research** | Portfólio ops + MRB | Problema/mercado observado; Decision Quality OK |
| 1 | **Dataset** | `providers/<game>/` ou API externa | Fonte versionada, licença OK, smoke load |
| 2 | **MetadataMapper** | `MetadataMapper.ts` | Campos canônicos: nome, set, rarity, collector #, idioma |
| 3 | **ImageResolver** | `ImageResolver.ts` | URL estável + fallback; % imagens no dashboard |
| 4 | **GameConfiguration** | `GameConfig.ts` + registry | `MarketProfile`, rarities, filters, wizard copy |
| 5 | **Capabilities** | `GameCapabilities` | Matriz atualizada (`npm run test:ops-reports`) |
| 6 | **ProviderLifecycle** | `RegisteredProvider.lifecycle` | `research` → `planned` → `implemented` |
| 7 | **Certification** | `PROVIDER_CERTIFICATION.md` + profile ops | Checklist PASS/FAIL documentado |
| 8 | **Shadow** | `RolloutMode SHADOW` | Sync sem superfície marketplace |
| 9 | **Canary** | `CANARY` + exit gate | Busca/PDP internos; métricas `gameScopedMetrics` |
| 10 | **Live** | `LIVE` | Visível conforme `isMarketplaceVisible` |

## Beachhead (só R1)

Lorcana permanece único **beachhead** (`lifecycle: beachhead`) até novo ADR de foco comercial.

## Verificação

1. `npm run test --workspace` (API catalog tests).
2. `npm run test:ops-reports` — readiness, certification dashboard, capability matrix.
3. SHADOW exit gate (`docs/architecture/SHADOW_EXIT_GATE.md`).
4. Entrada no [Readiness Matrix](./OPS_REPORTS.md) com North Star / Expand explícitos.

## Anti-padrões

- Rarities/filtros hardcoded no frontend fora de `game-config`.
- Métricas de mercado inventadas em CI (usar placeholders ops ou warehouse real).
- Pular Shadow em jogos com variantes complexas (MTG, Pokémon).

## Documentos relacionados

- [Provider Lifecycle](../architecture/PROVIDER_LIFECYCLE.md)
- [Release 2 Provider Progress](../architecture/RELEASE_2_PROVIDER_PROGRESS.md)
- [R3 — framework vs. catálogo](./R3_FRAMEWORK_EXPANSION.md)
