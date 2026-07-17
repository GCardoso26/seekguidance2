# ADR-013 — TCG Expansion Allowlist & Denylist

**Status:** Accepted  
**Data:** 2026-07-17  
**Tags:** beachhead, expansion, roadmap, providers  
**Relaciona:** [ADR-012](./ADR-012-lorcana-first-beachhead.md) · [`MARKET_VIABILITY_SCORE.md`](../../product/MARKET_VIABILITY_SCORE.md) · [`MVP_1_0_RELEASE_PLAN.md`](../MVP_1_0_RELEASE_PLAN.md)  
**Supersedes:** ordem de expansão R2–R4 e “Watch Gundam” em ADR-012 (beachhead R1 Lorcana **permanece**)

## Context

Proxies públicos (Liga Bazar, tráfego) e discussão de MVS geraram candidaturas variáveis (One Piece R2, Gundam watch, etc.).

Sem allowlist explícita, documentação e engenharia tendem a:

- sugerir TCGs sem massa crítica no BR  
- manter “maybe” infinito no roadmap  
- diluir o beachhead Lorcana  

## Decision

### Allowlist — ordem estratégica

| Release | TCG | Objetivo |
|---------|-----|----------|
| **R1** | Disney Lorcana | LPC recorrente (beachhead) |
| **R2** | Magic: The Gathering · Pokémon TCG | Escala em mercados com massa crítica comprovada |
| **R3** | One Piece · Dragon Ball Super Fusion World · Digimon | Replicar liquidez em nichos Bandai / animes |
| **R4** | Riftbound · Naruto TCG | Só após lançamento oficial **e** validação de mercado (nova evidência) |

Nenhum outro TCG entra sem **novo ADR**.

A arquitetura continua multi-TCG via Provider Adapter.  
Isto é ordem **comercial/engenharia de expansão**, não Lorcana-only.

### Denylist — removidos do roadmap

Sem evidência suficiente de liquidez, oferta consistente e massa crítica no mercado brasileiro para justificar investimento de engenharia:

| Removido | Não deve aparecer como |
|----------|------------------------|
| Cardfight!! Vanguard | Maybe-Go · Expansão · Backlog · Future provider · sugestão automática |
| Star Wars Unlimited | idem |
| Union Arena | idem |

Se reaparecerem em docs/código de produto → **desvio** → propor remoção imediata.

### Fora da allowlist (não são R2–R4)

Inclui, entre outros, Gundam Card Game como candidato implícito de “watch” anterior: **não** está na allowlist; exige ADR novo se for reconsiderado.

## Consequences

### Não altera

- Beachhead R1 = Lorcana (ADR-012)  
- Domínios · contratos · North Star LPC/LCS  
- Provider `LORCANA:lorcana-dataset`  

### Altera

- Ordem pós-R1 documentada em MVP / North Star / MVS  
- Denylist obrigatória em qualquer planejamento de provider  

### Relação com ADR-006

Certification por provider continua obrigatória antes de LIVE.  
Allowlist ≠ certified.

## Future

Reabrir denylist ou alterar ordem R2–R4 exige **ADR que supersede este**.
