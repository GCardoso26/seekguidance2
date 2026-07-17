# Market Viability Score (MVS) — Análise de proxies

**Status:** Supporting analysis (não supersede ADR)  
**Ordem oficial de expansão:** **[ADR-013](../architecture/adr/ADR-013-tcg-expansion-allowlist.md)**  
**Relaciona:** [`NORTH_STAR_RELEASE_1.md`](./NORTH_STAR_RELEASE_1.md) · [ADR-012](../architecture/adr/ADR-012-lorcana-first-beachhead.md)

O Bazar da Liga é um **proxy inicial útil**, não um indicador permanente de oferta/demanda.

### Limitações do proxy Liga Bazar

| Limitação | Por quê importa |
|-----------|-----------------|
| Só atividade dentro da Liga | Ignora WhatsApp, Discord, lojas próprias, ML |
| Não é GMV | Cópias listadas ≠ vendas concluídas |
| Pode incluir listas frias | Anúncios antigos / pouco ativos |
| P2P ≠ Marketplace de lojas | Pokémon/MTG concentram volume em lojas + sealed |

---

## Cinco eixos (0–100 cada) — ferramenta de análise

| Eixo | Pergunta | Sinais (exemplos) |
|------|----------|-------------------|
| **Market Size** | Quão grande é o mercado BR? | Visitas · #lojas · torneios · comunidade |
| **Beachhead** | Quão fácil conquistar os primeiros usuários? | Acesso founder · fragmentação |
| **Liquidity** | Há profundidade nas cartas-chave? | LCS · SD · SCI · watchlist |
| **Competition** | Quão forte é o incumbente? | Domínio Liga (*alto = pior para challenger*) |
| **Growth** | O jogo está expandindo? | Lançamentos · hype · tendência |

`Competition_fit = 100 - força_do_incumbente`.

```text
MVS = 0.15·Market + 0.30·Beachhead + 0.25·Liquidity
    + 0.20·Competition_fit + 0.10·Growth
```

MVS **informa**; **não** redefine a allowlist. Ordem canônica = ADR-013.

### Snapshot Liga (16/07/2026) — scores de análise

| TCG | Market | Beach | Liq. | Comp.fit | Growth | **MVS** | ADR-013 |
|-----|--------|-------|------|----------|--------|---------|---------|
| Lorcana | 35 | 90 | 45 | 75 | 80 | **68** | **R1** |
| MTG | 95 | 30 | 90 | 20 | 50 | **53** | **R2** |
| Pokémon | 98 | 35 | 70 | 25 | 55 | **52** | **R2** |
| One Piece | 40 | 70 | 40 | 65 | 75 | **58** | **R3** |
| Digimon | 15 | 45 | 20 | 60 | 40 | **35** | **R3** |
| DB Fusion | 20 | 50 | 25 | 55 | 45 | **38** | **R3** |

**Denylist (ADR-013):** Vanguard · Star Wars Unlimited · Union Arena — não ranquear como expansão.

---

## Roadmap oficial (ADR-013)

```text
R1  Lorcana
R2  MTG · Pokémon
R3  One Piece · Dragon Ball Fusion · Digimon
R4  Riftbound · Naruto (após lançamento + validação)
```

---

## Supporting KPIs de marketplace (beta)

### Seller Concentration Index (SCI)

```text
SCI = listings ativos / sellers ativos
```

Acompanhar distribuição: **SD** (mediana), **SCI-Top1**, **SCI-HHI**.  
`SCI ≫ SD` → poucas lojas dominam.

### Demand Concentration (DC)

```text
DC50 = menor N tal que as N cartas mais buscadas ≥ 50% das buscas
```

---

## Relação com North Star R1

| KPI | Papel |
|-----|-------|
| **LPC** | North Star (resultado) |
| **LCS** | Cobertura watchlist |
| **SD / SCI** | Profundidade / concentração supply |
| **DC50** | Concentração demanda |

Gate Sprint 9: LPC ≥ 1 · LCS ≥ 80% · tendência positiva (North Star / ROLE).
