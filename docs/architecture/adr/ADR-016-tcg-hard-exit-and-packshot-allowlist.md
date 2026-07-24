# ADR-016 — TCG Hard-Exit Denylist & Packshot Allowlist Expansion

**Status:** Accepted  
**Data:** 2026-07-24  
**Tags:** beachhead, expansion, denylist, packshot, sealed  
**Relaciona:** [ADR-012](./ADR-012-lorcana-first-beachhead.md) · [ADR-013](./ADR-013-tcg-expansion-allowlist.md) · [ADR-015](./ADR-015-architecture-freeze-product-first.md) · [`PLATFORM_CONSTITUTION.md`](../PLATFORM_CONSTITUTION.md)  
**Supersedes (parcial):** ADR-013 nos pontos de denylist operacional e de jogos elegíveis a sealed/packshot de produto — **não** altera beachhead R1 Lorcana nem a ordem R2–R4 de liquidez.

## Context

Evidência operacional em `judgetcg.com.br` (2026-07-23):

- Lorcana: único TCG com packshots oficiais (parcial); Troves sem imagem até sync.
- MTG / Pokémon: 100% ícone de set, não packshot.
- Publishers Bandai / FAB / Riftbound: seeds `cdn.judgetcg.example` (não-resolvíveis).
- YGO: sealed sem `image_url`.
- Gundam / Sorcery: demanda de produto sealed; Gundam ausente do catálogo sealed.
- SWU / Vanguard / Union Arena: **sem demanda suficiente** no ecossistema BR do JudgeTCG; ainda vazavam em filtros, seller tabs e themes.

ADR-013 já denylistava Vanguard · SWU · Union Arena e excluía Gundam da allowlist (exigia novo ADR). Este ADR formaliza a decisão de produto do founder (2026-07-24).

## Decision

### 1. Hard-exit denylist (até segunda ordem / ADR futuro)

Os seguintes TCGs ficam **fora do ecossistema de produto** até ADR explícito de reentrada:

| Código | Nome |
|--------|------|
| `VANGUARD` | Cardfight!! Vanguard |
| `UARENA` | Union Arena |
| `SWU` | Star Wars: Unlimited |

**Obrigatório remover / não promover:**

- Navegação, mega-menu, home universe, filtros marketplace, seller catalog tabs, judge/torneio pickers, admin ingest de produto, logos de produto, sealed publishers.

**Não obrigatório nesta decisão:** DROP de dados históricos no banco (órfãos não navegáveis ok; purge DB = ops futuro).

### 2. Allowlist sealed / packshot (expansão)

Além da ordem de liquidez R1–R4 do ADR-013, os seguintes jogos são **elegíveis** a seed sealed mínimo e packshots curados com URL oficial verificada (HTTP 200 / página fabricante):

| Código | Nome | Nota |
|--------|------|------|
| `YUGIOH` / `YGO` | Yu-Gi-Oh! | Remediação packshot (já há sealed) |
| `FAB` | Flesh and Blood | Remediação (remover CDN fake) |
| `GUNDAM` | Gundam Card Game | Entrada sealed + nav produto |
| `SORCERY` | Sorcery: Contested Realms | Entrada sealed + nav produto |

Beachhead **R1 = Lorcana** permanece (ADR-012).

### 3. Ordem de esforço packshot

1. Lorcana (sync Troves / ROF / ATV)  
2. MTG · Pokémon (honestidade ícone ≠ packshot; manifest só com fonte oficial)  
3. YGO · FAB  
4. One Piece · Digimon · DBFW · Riftbound (dropar `*.example`)  
5. Gundam · Sorcery (entrada)

### 4. Regra de ouro de packshot

Nenhuma URL inventada. Manifest = evidência (CDN oficial / listagem fabricante). Preferir `image_url: null` a placeholder falso.

## Consequences

### Não altera

- LPC / LCS / North Star R1  
- Domínios Marketplace / Checkout / Payment  
- ADR-013 ordem R2–R4 de **liquidez** (MTG·Pokémon → Bandai → Riftbound·Naruto)

### Altera

- Denylist operacional = hard-exit de produto (não “maybe disabled”)  
- Gundam / Sorcery / YGO / FAB autorizados a sealed/packshot sem violar Constitution  
- SWU deixa de ser candidato a packshot ou nav

## Future

Reabrir Vanguard / UArena / SWU exige **novo ADR**.  
Alterar allowlist sealed sem evidência de fonte de imagem = desvio Guardian.
