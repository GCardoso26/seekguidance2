# R3 — provar o framework, não só o catálogo

**Complemento estratégico** ao [ADR-013](../architecture/adr/ADR-013-tcg-expansion-allowlist.md): a allowlist comercial de R3 (One Piece, Digimon, Dragon Ball, etc.) **não muda** aqui. O que muda é o **critério de sucesso de engenharia** em R3.

## Roadmap reinterpretado

| Fase | Foco comercial | Foco de engenharia |
| --- | --- | --- |
| **R1** | Liquidez Lorcana (beachhead) | LPC/LCS/SD, Beta real |
| **R2** | MTG + Pokémon na mesma stack | Modularizar Scryfall + segundo provider dataset |
| **R3** | Novos mercados/jogos na allowlist | **Cada novo TCG entra só via Playbook** — zero mudança estrutural |
| **R4** | **Evidence Release** — reduzir incertezas | Observar Onda 1 / Beta; **não** aumentar código por feature creep — ver [`EVIDENCE_RELEASE_R4.md`](./EVIDENCE_RELEASE_R4.md) |
| **R4+ TCG** | Escala LATAM / global (allowlist) | Reuso de mercados (mesmo framework, outro `gameCode`) **após** evidência |

## Definição de “framework provado” (R3)

1. Tempo do passo 1 ao 10 do [Expansion Playbook](./EXPANSION_PLAYBOOK.md) **decrescente** entre o 1º e o 3º jogo R3.
2. `Cardgame Readiness` Overall ≥ 90% antes de `LIVE` (relatório ops).
3. `Capability Matrix` como documentação viva — sem coluna “surpresa” no MRB.
4. Nenhum PR R3 que adicione `if (game === 'X')` fora de `GameConfiguration` / provider module.

## O que R3 **não** é

- Corrida para maximizar contagem de TCGs sem certificação.
- Substituir North Star por % do readiness report (readiness é **pré-condição**, não KPI de mercado).

## Métricas de acompanhamento

- [Ops Reports](./OPS_REPORTS.md) — gerados em cada release candidate.
- MRB — comparar pendências MTG/Pokémon com o próximo jogo R3.
- ADR novo **somente** se a allowlist comercial ou tiers mudarem.

## Naruto / R4

Jogos R4 aparecem na matriz como `planned` até ADR + dataset; servem para planejamento, não para compromisso de data.
