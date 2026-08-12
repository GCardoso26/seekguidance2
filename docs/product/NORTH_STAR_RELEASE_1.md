# North Star — Release 1 (Lorcana Beachhead)

**Status:** Congelado — framework de métricas R1  
**Relaciona:** [`ADR-012`](../architecture/adr/ADR-012-lorcana-first-beachhead.md) · [`MVP_1_0_RELEASE_PLAN.md`](../architecture/MVP_1_0_RELEASE_PLAN.md) · [`LPC_ANALYTICS_SPEC.md`](./LPC_ANALYTICS_SPEC.md) · [`MARKET_VIABILITY_SCORE.md`](./MARKET_VIABILITY_SCORE.md) · [`BETA_COMMAND_CENTER.md`](../operations/BETA_COMMAND_CENTER.md)

Narrativa congelada (onboarding de qualquer pessoa no projeto):

```text
A arquitetura já suporta múltiplos TCGs.
O Release 1 escolhe Lorcana apenas como beachhead comercial.
O sucesso do beta não é medido por faturamento, mas por liquidez.
Liquidez = LPC + LCS + SD/SCI + DC.
Sprint 9 só começa com evidência de que oferta e demanda se encontram.
Ordem TCG: R1 Lorcana → R2 MTG+Pokémon → R3 OP/DB/Digimon → R4 Riftbound/Naruto (ADR-013).
```

Três camadas que **não** se misturam:

| Camada | Papel | Conhece Lorcana? |
|--------|-------|------------------|
| **Foundation** | Catalog · Marketplace · Identity · Checkout · Payment · Search · Projection | Não |
| **Beachhead** | Configuração estratégica do Provider do Release | Sim (R1 = LORCANA) |
| **Mercado** | Hipótese a invalidar no beta | Sim |

Hipótese R1:

> Uma plataforma especializada em Disney Lorcana consegue gerar liquidez?

---

## Critério de entrada vs critério de escala

| | Entrada (gate R1) | Escala (evolução do beta) |
|--|-------------------|---------------------------|
| Pergunta | É possível acontecer? | Isso acontece repetidamente? |
| Sinal | LPC ≥ 1 | LPC/semana · lojas distintas · buyers distintos |
| Agora | Formal — abre conversa Sprint 9 | Observar; **não** muda o gate no meio da janela |

---

## North Star Metric — Liquidity Proof Count (LPC)

**LPC** = número de eventos em que o marketplace funcionou **sem intervenção humana**.

Especificação verificável (invariantes **R1-LPC-001 … 005**): [`LPC_ANALYTICS_SPEC.md`](./LPC_ANALYTICS_SPEC.md).

```text
Seller A publica listing da carta X
      ↓
Buyer B abre a PDP de X
      ↓
Buyer B visualiza oferta
      ↓
Buyer B adiciona ao carrinho
```

| LPC mede | LPC **não** mede |
|----------|------------------|
| Oferta × procura se encontraram | Faturamento |
| Ciclo entre pessoas independentes | Comissão / Stripe |
| Liquidez real | Marketing / indicação da equipe |

**Gate formal Sprint 8 → 9:** LPC ≥ 1 (prova de **possibilidade** / entrada).

### Companheiros de tendência (escala — não alteram o gate)

| Sinal | Pergunta |
|-------|----------|
| LPC / semana | A curva sobe? |
| LPC com lojas distintas | Mais de um seller no proof? |
| LPC com compradores distintos | Mais de um buyer no proof? |

---

## Leading indicator — Liquidity Coverage Score (LCS)

```text
LCS = (cartas da watchlist com ≥1 oferta ativa)
      ─────────────────────────────────────────
      (total de cartas na watchlist)
```

Exemplo: 18/20 → **LCS = 90%**. Meta go → Sprint 9: LCS ≥ **80%**.

---

## Supporting KPI — Supply Depth (SD)

```text
SD = mediana(listings ativos por loja ativa)
```

Não é gate. Diferencia 5×1 listing de 5×80 listings; mediana evita outlier de uma loja com 300.

---

## Supporting KPI — Seller Return Rate (SRR)

```text
SRR = (sellers que voltaram — ≥2ª sessão de publicação)
      ──────────────────────────────────────────────────
      (sellers ativados — ≥1 listing)
```

Exemplo: 5 ativados → 3 voltaram → **SRR = 60%**.

| SRR responde | SRR **não** responde |
|--------------|----------------------|
| O marketplace gerou vontade de **continuar** publicando? | Se oferta encontrou demanda (isso é **LPC**) |
| Retenção operacional do seller | Cobertura da watchlist (**LCS**) |
| Qualidade da ativação ao longo do tempo | Profundidade de estoque (**SD**) |

**Não é gate** de Sprint 8 → 9 (o gate permanece **LPC ≥ 1**).  
É companion de tendência — junto de SCI/DC — para o [Founder Report](../operations/FOUNDER_REPORT_TEMPLATE.md) e o [MRB](../operations/MARKET_REVIEW_BOARD.md).

---

## Supporting KPI — Seller Concentration Index (SCI)

```text
SCI = listings ativos / sellers ativos   (= média)
```

**300 anúncios / 1 loja** (SCI=300) é péssimo.  
**300 anúncios / 30 lojas** (SCI=10) é saudável.

SCI sozinho engana — acompanhar a **distribuição**:

| Métrica | Significado |
|---------|-------------|
| **SCI** | média |
| **SD** | mediana — se SCI ≫ SD, poucas lojas dominam |
| **SCI-Top1** | % dos listings da maior loja |
| **SCI-HHI** | Σ share² — quanto maior, mais concentrado |

Ideal em escala: várias lojas em faixa próxima (25, 18, 16, 14…), não (180, 70, 20, 15, 15).

---

## Supporting KPI — Demand Concentration (DC)

```text
DC50 = menor N de cartas que somam ≥ 50% das buscas (buyer_search)
```

Se 12–15 cartas explicam metade das buscas, a Liquidity Watchlist fica muito mais precisa.  
Complemento: **DC-Share(Top20)** = % das buscas cobertas pela watchlist atual.

Detalhe + MVS: [`MARKET_VIABILITY_SCORE.md`](./MARKET_VIABILITY_SCORE.md).  
Ordem allowlist/denylist: [`ADR-013`](../architecture/adr/ADR-013-tcg-expansion-allowlist.md).

---

## Matriz operacional LCS × LPC

Pergunta da weekly: **Em qual quadrante estamos?**

| LCS | LPC | Interpretação | Ação |
|-----|-----|---------------|------|
| **Alto** | **Alto** | Oferta suficiente; compradores encontram anúncios | Preparar Payment |
| **Alto** | **Baixo** | Há estoque; descoberta / aquisição / confiança | Investigar demanda — **não** Stripe |
| **Baixo** | **Alto** | Sucessos pontuais; cobertura limitada | Ampliar supply / watchlist |
| **Baixo** | **Baixo** | Problema = formação de oferta | Foco total em sellers — **não** features |

Cruzar com **SD**: LCS alto + SD baixo (mediana ~1) → oferta fina.

A matriz existe para eliminar discussão subjetiva e a tentação de criar funcionalidades quando o problema é outro.

---

## Evento sintético — `liquidity_proof_completed`

Derivado offline. Só conta se **todas** as invariantes R1-LPC-001…005 forem verdadeiras.  
Detalhe: [`LPC_ANALYTICS_SPEC.md`](./LPC_ANALYTICS_SPEC.md) · código: `apps/web/src/analytics/liquidityProof.ts`.

---

## Três perguntas do beta

1. Lojas publicam estoque Lorcana? (ativação + **SD** + **SCI**/distribuição)  
2. Compradores encontram ofertas na watchlist? (**LCS** · afinar com **DC50**)  
3. O ciclo se repete entre pessoas independentes? (**LPC** + tendência)

---

## Congelamento do framework

LPC · LCS · SD · SRR/SCI/DC (supporting) · matriz · invariantes R1-LPC-001…005 · gate de entrada · MVS estão **congelados**.  
Ordem de expansão TCG: **ADR-013** (não a ordem MVS histórica One Piece→MTG).

**SRR** foi adicionado como supporting KPI (retenção de seller); **não** altera o gate LPC ≥ 1.  
Ritual de valor de mercado: [`MARKET_REVIEW_BOARD.md`](../operations/MARKET_REVIEW_BOARD.md).

Maior risco daqui em diante: disciplina de executar o experimento (freeze 7 dias do protocolo Onda 1), registrar dados e **não** reinterpretar resultados antes de completar a janela de observação.

## Fora do escopo até LPC recorrente

IA · recomendação · dashboard ERP · CSV · ranking · social · SEO · payment.

## Nota — oferta confiável (ADR-018)

Liquidez R1 conta oferta de **loja verificada (CNPJ)**. Seller pessoa física / plano free não é o modelo de beachhead; ver ADR-018 e SELLER_ACCREDITATION_SPEC.

