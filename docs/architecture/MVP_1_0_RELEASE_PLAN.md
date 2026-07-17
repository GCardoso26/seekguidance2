# MVP 1.0 Release Plan — JudgeTCG (Lorcana-First)

**Status:** Congelado — pós Sprint 6 (90D concluído) · **tese de mercado atualizada**  
**Objetivo:** provar liquidez no mercado brasileiro de singles de **Disney Lorcana**, conectando lojas especializadas e jogadores através de busca oficial, ofertas verificáveis e checkout consistente.

**Relaciona:** [`ROADMAP_90D.md`](./ROADMAP_90D.md) · [`FOUNDATION_OPERATIONS.md`](../operations/FOUNDATION_OPERATIONS.md) · [`SYSTEM_FLOW.md`](./SYSTEM_FLOW.md) · [`SPRINT_8_PLAN.md`](../product/SPRINT_8_PLAN.md) · [`ADR-012`](./adr/ADR-012-lorcana-first-beachhead.md) · [`NORTH_STAR_RELEASE_1.md`](../product/NORTH_STAR_RELEASE_1.md)

---

## North Star (Release 1)

| KPI | Definição | Meta Sprint 8→9 |
|-----|-----------|-----------------|
| **LPC** — Liquidity Proof Count | Seller A publica → Buyer B abre PDP → vê oferta → cart · **R1-LPC-001:** `sellerId != buyerId` | ≥1 (possibilidade); acompanhar tendência |
| **LCS** — Liquidity Coverage Score | watchlist com oferta ÷ tamanho da watchlist | ≥**80%** |
| **SD** — Supply Depth | mediana(listings / loja ativa) | Supporting (não é gate) |

Matriz LCS×LPC e tendência: [`NORTH_STAR_RELEASE_1.md`](../product/NORTH_STAR_RELEASE_1.md).

Não mede: GMV · Stripe · comissão · indicação da equipe.

---

## Mudança estratégica

O MVP deixa de ser **MTG-first** e passa a ser **Lorcana-first**.

| Antes | Agora |
|-------|--------|
| Marketplace genérico de TCG → validar em MTG | Marketplace de singles em mercados em expansão |
| Beachhead = MTG Brasil | Beachhead = **Disney Lorcana Brasil** |
| MTG = validação | MTG = **expansão posterior** |

Esta mudança **não altera a arquitetura**.  
A plataforma continua multi-TCG via Provider Adapter.  
Apenas o **primeiro mercado validado** muda.

### Nova hipótese (oficial)

O mercado brasileiro de Disney Lorcana apresenta crescimento acelerado, oferta fragmentada e pouca infraestrutura dedicada para descoberta de singles.

O Release 1 prova **liquidez**:

```text
Pessoa A publica uma carta
  → Pessoa B procura essa carta
  → Pessoa B encontra uma oferta
  → Pessoa B inicia uma compra
```

Sem intervenção da equipe.

---

## O que permanece igual

As quatro invariantes continuam congeladas.

### 1. Catalog = Source of Truth

```text
Provider (Lorcana)
  → Catalog
  → Outbox
  → Search Projection
  → Public API
```

O Provider deixa de ser o beachhead Scryfall/MTG e passa a Lorcana.  
Nada muda em Marketplace, Checkout, Payment, Search engine.

**Release 1 (ingestão):** preferir dataset comunitário estável (Dreamborn / Lorcast / cards.json versionado) + imagens por ID — **sem** cron automático frágil no início. Outbox/Projection já estão provados.

### 2. Marketplace = Overlay

```text
Catalog Card + Listing + Inventory + Seller → Rendered Card
```

Nenhum dado comercial contamina o catálogo.

### 3. Checkout

```text
Cart → Reservation → Payment → Order
```

Sem alterações.

### 4. Payment isolado

```text
Order ≠ Payment
```

Gateway independente do jogo.

---

## Estado pós Sprint 6 (válido)

Foundation: Event Driven · Search Projection · Catalog · Marketplace · Identity · Checkout · Reservation · Payment · Public API · Observabilidade.

Nenhum domínio será reaberto por causa da troca de beachhead.

| Área | Impacto da troca |
|------|------------------|
| Catalog Sync | 🟡 Médio (novo Provider Lorcana) |
| Search / Marketplace / Checkout / Payment | 🟢 Quase zero |
| Frontend | 🟢 Muito baixo (copy / default game) |
| Beta / aquisição sellers | 🟢 Melhor |

~90% do trabalho recente permanece válido.

---

## Objetivo do Release 1

Validar liquidez no mercado brasileiro de Disney Lorcana.

Não validar arquitetura · IA · múltiplos jogos.

---

## Roadmap 30–60–90

### Fase 1 — Hardening

Primeiros sellers reais: email verification · password reset · rate limiting · login protection.

### Fase 2 — Beta fechado (Sprint 8)

**5–10 lojas especializadas** em Disney Lorcana.

Métricas: `seller_activation_rate` · `seller_time_to_first_listing` · `active_listings` · `cards_with_offers` · Liquidity Watchlist Lorcana.

Metas de volume (qualidade > bulk):

| Métrica | Meta |
|---------|------|
| **LPC** (Liquidity Proof Count) | ≥1 ciclo A→B→cart (buyer ≠ seller) |
| **LCS** (Liquidity Coverage Score) | ≥**80%** |
| Lojas ativas | ≥5 especializadas |
| Listings relevantes | **150–300** |
| Buyer | ≥1 chega ao carrinho sem ajuda |

### Fase 3 — Primeiro GMV

Primeira venda real · comissão ou plano Pro.

---

## Liquidity Watchlist (Lorcana)

Sucesso **não** é quantidade total de listings.  
É cobertura das cartas mais procuradas.

Pergunta:

> Quando alguém procura *Rapunzel – Gifted with Healing*, existe oferta?

Lista viva: [`docs/operations/BETA_COMMAND_CENTER.md`](../operations/BETA_COMMAND_CENTER.md).

---

## Critérios para Sprint 9 (Payment)

| Eixo | Critério |
|------|----------|
| **LPC** | ≥1 Liquidity Proof (independente) |
| **LCS** | ≥80% da watchlist com oferta |
| Supply | ≥5 lojas ativas |
| Listings | 150–300 relevantes |
| Seller | 2ª sessão sem ajuda |

---

## Fora do escopo (Release 1)

IA · Multi-TCG no beta · Dashboard ERP · SEO · Chat · Social · CSV · Pagamento real **antes** da liquidez.

---

## Expansão (após Lorcana)

Ordem oficial — **[ADR-013](./adr/ADR-013-tcg-expansion-allowlist.md)**:

| Release | TCG | Objetivo |
|---------|-----|----------|
| R1 | Lorcana | LPC recorrente |
| R2 | MTG · Pokémon | Escala em mercados com massa crítica |
| R3 | One Piece · DB Fusion · Digimon | Replicar liquidez em nichos |
| R4 | Riftbound · Naruto | Após lançamento + validação |
| **Denylist** | Vanguard · SWU · Union Arena | Sem evidência BR suficiente |

Via Provider Adapters apenas — sem reabrir domínio.

```text
providers/lorcana/*     → R1
providers/mtg/*         → R2
providers/pokemon/*     → R2
providers/onepiece/*    → R3
…
```
---

## Princípio

O Release 1 não prova que o JudgeTCG “suporta vários TCGs”.  
Prova que um marketplace especializado gera liquidez.

Arquitetura já foi validada.  
Agora a métrica é: **oferta · demanda · GMV**.
