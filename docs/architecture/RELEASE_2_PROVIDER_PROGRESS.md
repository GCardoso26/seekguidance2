# Release 2 — Provider Expansion Progress

**Status:** Implementação engenharia (modular + GameConfig)  
**Allowlist:** [ADR-013](./adr/ADR-013-tcg-expansion-allowlist.md) — R2 = **MTG · Pokémon** (One Piece = R3)  
**Certification:** [ADR-006](./adr/ADR-006-provider-certification.md) · [PROVIDER_CERTIFICATION.md](./PROVIDER_CERTIFICATION.md)

## Hipótese

> O modelo validado em Lorcana também funciona em mercados maiores?

## Ciclo de vida dos Providers

```text
Research → Planned → Implemented → Shadow → Canary → Live → Beachhead
```

| Stage | RolloutMode típico | Estado atual |
|-------|-------------------|--------------|
| Beachhead | LIVE | Lorcana |
| Shadow | SHADOW | Scryfall / MTG |
| Implemented | OFF | Pokémon (código pronto, sync off) |
| Planned | — | One Piece · Digimon · Dragon Ball |
| Research | — | Riftbound · Naruto (allowlist R4) |

Código: `providers/ProviderLifecycle.ts` · campo `RegisteredProvider.lifecycle`.

## GameConfiguration enriquecido

Além de rarities/synonyms/watchlist:

- **MarketProfile** — `releaseTier`, `primaryMarket`, `liquidityHypothesis`, `watchlistTargetSize`, `catalogProviderId`
- **GameCapabilities** — foil/etched/serialized/reverseHolo/commanderStyle/… (UI sem `if (game)`)

## Entregue (código)

| Item | MTG | Pokémon | Lorcana |
|------|-----|---------|---------|
| CatalogProvider modular | Sim (Scryfall + Mapper/Image/GameConfig) | Sim (dataset SHADOW) | Sim (R1) |
| MetadataMapper | `providers/magic/` | `providers/pokemon/` | `providers/lorcana/` |
| ImageResolver | Sim | Sim | Sim |
| Dataset / HTTP | Scryfall HTTP | `cards.json` versionado | `cards.json` |
| GameConfiguration | Sim | Sim | Sim |
| Factory key | `MTG:scryfall` | `POKEMON:pokemon-dataset` | `LORCANA:lorcana-dataset` |
| Registry default mode | SHADOW (`SCRYFALL_ROLLOUT_MODE`) | **OFF** (`POKEMON_ROLLOUT_MODE`) | LIVE |
| FE filters/synonyms/wizard | via `lib/game-config` | via `lib/game-config` | via `lib/game-config` |
| Métricas `*_per_game` | `catalog/metrics/gameScopedMetrics.ts` | idem | idem |

## Certificação (ops — não automatizado neste PR)

### MTG / Scryfall

- [ ] Critérios [SHADOW_EXIT_GATE.md](./SHADOW_EXIT_GATE.md) verdes
- [ ] Sprint 2.5 stress
- [ ] Promover `SCRYFALL_ROLLOUT_MODE=CANARY` → revisão humana → `LIVE`
- [ ] Checklist [PROVIDER_CERTIFICATION.md](./PROVIDER_CERTIFICATION.md) assinado

### Pokémon

- [ ] Pré-requisito: Scryfall CANARY/LIVE estável (ADR-006)
- [ ] `POKEMON_ROLLOUT_MODE=SHADOW` + sync dataset
- [ ] Checklist certification → CANARY → LIVE
- [ ] Expandir dataset além do seed R2 shadow

## Explicitamente fora do R2

One Piece (R3) · Stripe novo · IA/SEO/Social · alterar LPC/LCS/SD · novos bounded contexts

## Rollback

| Provider | Ação |
|----------|------|
| Scryfall | `SCRYFALL_ROLLOUT_MODE=SHADOW` ou `OFF` |
| Pokémon | `POKEMON_ROLLOUT_MODE=OFF` (default) |
| FE | GameConfig fallback Lorcana |

## Visibilidade ops (dashboards)

Relatórios gerados: [`OPS_REPORTS.md`](../operations/OPS_REPORTS.md) · playbook [`EXPANSION_PLAYBOOK.md`](../operations/EXPANSION_PLAYBOOK.md) · tese R3 [`R3_FRAMEWORK_EXPANSION.md`](../operations/R3_FRAMEWORK_EXPANSION.md).

```bash
npm run test:ops-reports
```
