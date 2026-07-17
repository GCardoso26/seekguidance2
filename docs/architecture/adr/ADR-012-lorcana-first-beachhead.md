# ADR-012 — Lorcana-first Beachhead Strategy

**Status:** Accepted  
**Data:** 2026-07-16  
**Tags:** beachhead, release-1, lorcana, go-to-market, providers  
**Relaciona:** [`MVP_1_0_RELEASE_PLAN.md`](../MVP_1_0_RELEASE_PLAN.md) · [ADR-001](./ADR-001-catalog-source-of-truth.md) · [ADR-006](./ADR-006-provider-certification.md)

## Context

JudgeTCG foi inicialmente concebido para validar liquidez utilizando Magic: The Gathering (Scryfall) como beachhead do Release 1.

Durante a preparação do Release 1 observou-se:

- acesso direto a lojas especializadas em Disney Lorcana
- crescimento acelerado do mercado brasileiro de singles
- menor competição em descoberta especializada
- maior capacidade de founder-led validation (supply próximo)

A arquitetura Domain-Oriented Platform já está multi-TCG via Provider Adapter.  
Trocar o **mercado validado primeiro** não exige reabrir Marketplace, Checkout, Payment, Identity ou Search.

## Decision

O **Release 1** utiliza **Disney Lorcana** como beachhead de liquidez.

A plataforma permanece **TCG-first / multi-TCG** — não Lorcana-only.

| Release | Mercado | Objetivo |
|---------|---------|----------|
| **R1** | Disney Lorcana Brasil | LPC recorrente |

**Ordem pós-R1 (R2–R4, allowlist/denylist):** ver **[ADR-013](./ADR-013-tcg-expansion-allowlist.md)** (Accepted).  
A seção de expansão R2–R4 / Watch Gundam abaixo foi **superseded** pelo ADR-013.

~~| R2 | One Piece | … |~~  
~~| R3 | MTG | … |~~  
~~| R4 | Pokémon | … |~~  
~~| Watch | Gundam | … |~~

Resumo ADR-013:

| Release | TCG |
|---------|-----|
| R2 | MTG · Pokémon |
| R3 | One Piece · DB Fusion World · Digimon |
| R4 | Riftbound · Naruto (após lançamento + validação) |
| **Denylist** | Vanguard · Star Wars Unlimited · Union Arena |

Ingestão R1: dataset comunitário estável versionado (`cards.json`) — sem scraping frágil nem cron automático no início.

Hipótese mensurável do beta:

> Existe um grupo de lojas e jogadores de Disney Lorcana disposto a usar uma plataforma especializada **antes** de pagamento integrado?

Proof alvo = Liquidity Proof (A publica → B encontra → carrinho), não “primeira venda por indicação”.

### North Star (obrigatório em ops)

| KPI | Significado |
|-----|-------------|
| **LPC** | Quantas vezes o marketplace funcionou sozinho (**R1-LPC-001:** seller ≠ buyer) |
| **LCS** | Cobertura contínua da watchlist com ≥1 oferta |
| **SD** | Mediana de listings por loja ativa |
| **SCI** | Média listings/seller + distribuição (Top1 / HHI) |
| **DC50** | Quantas cartas = 50% das buscas (afina watchlist) |

Gate formal: LPC ≥ 1 + LCS ≥ 80%. Tendência LPC / matriz LCS×LPC: [`NORTH_STAR_RELEASE_1.md`](../../product/NORTH_STAR_RELEASE_1.md).

## Consequences

### Não altera

- Marketplace overlay  
- Checkout / Reservation  
- Payment  
- Identity / RBAC  
- Search Projection / Public API  
- Domain boundaries e ADRs 001–007  

### Altera

- Provider padrão do beachhead (`LORCANA:lorcana-dataset`)  
- Dataset inicial e operação beta  
- Estratégia comercial e copy do Release 1  
- Metas: ≥5 lojas · 150–300 listings relevantes · ≥80% watchlist  

### Relação com ADR-006

ADR-006 (Provider Certification) **permanece vigente**.  
Scryfall/MTG continua o piloto de certification da foundation.  
Lorcana-first é decisão de **mercado R1**, não isenção de certification para o provider entrar em LIVE.

## Future

Após liquidez Lorcana:

```text
providers/lorcana/*      → R1 beachhead
providers/mtg/*          → R2 (Scryfall)
providers/pokemon/*      → R2
providers/onepiece/*     → R3
providers/dragonball/*   → R3
providers/digimon/*      → R3
providers/riftbound/*    → R4
providers/naruto/*       → R4 (após lançamento + validação)
```

Ordem e denylist: [ADR-013](./ADR-013-tcg-expansion-allowlist.md).
Nenhum domínio comercial é reescrito por jogo.

## Supersedes / Clarifies

- Clarifica referências históricas a “MVP = MTG” em docs de foundation (`ROADMAP_90D.md`): válidas como histórico técnico; beachhead comercial R1 = este ADR.
- Não supersede ADR-001 nem ADR-006.
