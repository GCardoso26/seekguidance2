# Beta Command Center

**Sprint:** 8 — visão interna da equipe · **beachhead = Disney Lorcana Brasil**  
**Não é** dashboard de usuário / seller.  
**Objetivo:** em **≤5 minutos** saber se o marketplace está ganhando vida ou morrendo.  
**North Star:** **LPC** + **LCS** (+ **SD**) — [`NORTH_STAR_RELEASE_1.md`](../product/NORTH_STAR_RELEASE_1.md) · spec [`LPC_ANALYTICS_SPEC.md`](../product/LPC_ANALYTICS_SPEC.md)  
**Relaciona:** [`MVP_1_0_RELEASE_PLAN.md`](../architecture/MVP_1_0_RELEASE_PLAN.md) · [`SELLER_BETA_ONBOARDING_RUNBOOK.md`](./SELLER_BETA_ONBOARDING_RUNBOOK.md) · [`BETA_WEEKLY_REPORT_TEMPLATE.md`](./BETA_WEEKLY_REPORT_TEMPLATE.md) · [`BETA_INTERVIEW_SCRIPT.md`](./BETA_INTERVIEW_SCRIPT.md) · [`BETA_WAVE1_OPERATION_PROTOCOL.md`](./BETA_WAVE1_OPERATION_PROTOCOL.md)

Preencher diariamente (ou a cada check-in). **Primeiros 7 dias:** só observar + P0 — ver protocolo Onda 1.  
**Disciplina:** nenhum P1 vira código antes do Report #1 (registrar pedidos; não implementar).

---

## Checklist diário (5 min)

1. [ ] **LPC** (hoje / acum.) — proofs com R1-LPC-001?  
2. [ ] **LCS** — % watchlist com oferta  
3. [ ] **SD** — mediana listings / loja ativa  
4. [ ] Matriz LCS×LPC — qual quadrante?  
5. [ ] Seller Activation — funil + intent  
6. [ ] Algum P0 novo?  
7. [ ] Alguém **voltou sozinho** (2ª sessão)?  

**Liquidity Proof (1 unidade de LPC):** desconhecido publica → outro (≠ seller) busca → encontra oferta → cart — sem intervenção.


---

## 0. North Star (preencher primeiro)

| KPI | Hoje (2026-07-17 · Dia 0) | Acum. período | Meta / nota |
|-----|------|---------------|-------------|
| **LPC** — Liquidity Proof Count | **0** | 0 | Gate ≥1; ver tendência |
| **LCS** — Liquidity Coverage Score | **0%** | 0% | ≥80% |
| **SD** — Supply Depth (mediana) | — | | Supporting |
| **SCI** — listings/sellers (média) | — | | Ver distribuição |
| **SCI-Top1** — % da maior loja | — | % | Baixo é melhor |
| **DC50** — cartas = 50% buscas | — | | Afina watchlist |

**Dia 0:** migration + seed (10 cartas) + SMOKE_OK Rapunzel · Baseline [`BETA_REPORT_0_BASELINE.md`](./BETA_REPORT_0_BASELINE.md) · kit Lote 1 [`BETA_LOTE1_EXECUTION.md`](./BETA_LOTE1_EXECUTION.md) |

```text
LCS = (# watchlist com ≥1 oferta) / (tamanho watchlist)
SD  = mediana(listings ativos por loja ativa)
```

### Matriz rápida — pergunta da weekly: *Em qual quadrante estamos?*

| | LPC alto | LPC baixo |
|--|----------|-----------|
| **LCS alto** | Preparar Payment | Investigar aquisição / descoberta / confiança |
| **LCS baixo** | Ampliar cobertura (casos pontuais) | Foco total em supply |

Evento sintético: `liquidity_proof_completed` · invariantes **R1-LPC-001…005** ([`LPC_ANALYTICS_SPEC.md`](../product/LPC_ANALYTICS_SPEC.md)).  
Entrada = LPC ≥ 1 · Escala = tendência (não reinterprete o gate no meio da janela).

## 1. Supply Health

**Pergunta:** temos cartas vendáveis com oferta?

| Métrica | Hoje | Meta (onda 1 · Lorcana) |
|---------|------|-------------------------|
| Lojas convidadas | | 30 |
| Lojas aceitas | | ~10 |
| Lojas especializadas ativas (≥1 listing) | | **≥5** |
| Listings relevantes | | **150–300** |
| Cartas da watchlist com oferta | | ≥80% do top ~20 |

Notas do dia: _________________________________

---

## 2. Seller Activation

```text
Convite enviado
      ↓
Conta criada
      ↓
Loja criada
      ↓
Primeiro anúncio          ← “ativa”
      ↓
10 anúncios               ← depth mínimo de sessão
```

| Taxa | Hoje |
|------|------|
| convite → conta | |
| conta → loja | |
| loja → 1º anúncio | |
| signup → listing | |
| shop → listing | |
| intent `will_add_more` / maybe / no | |
| voltou sozinho (2ª sessão) | |

### Seller depth (obrigatório acompanhar)

Uma loja com **1 anúncio** pode ser só curiosidade.

```text
seller_depth = média de listings ativos por loja ativada
               (ideal: medir de novo após 7 dias)
```

| Loja | Listings hoje | Listings D+7 |
|------|---------------|--------------|
| | | |
| | | |
| | | |
| **Média** | | |

Interpretação:

- depth alto → ferramenta  
- depth ~1 e estagna → teste / abandono  

---

## 3. Liquidez por carta (métrica mais importante)

**Não** perguntar “quantas cartas existem no catálogo?”.  
Perguntar: **usuário busca → encontra oferta?**

### Liquidity Watchlist — Disney Lorcana (lista viva)

Pergunta: **quando alguém procura esta carta, existe oferta?**  
Atualizar com busca real no beta (`/search` → PDP → Ofertas).

#### Competitivo / staples

| Carta | Oferta? (S/N) | # offers | Preço min | Data check |
|-------|---------------|----------|-----------|------------|
| Diablo – Devoted Herald | | | | |
| Be Prepared | | | | |
| A Whole New World | | | | |
| Belle – Strange but Special | | | | |
| Rapunzel – Gifted with Healing | | | | |

#### Colecionável / alta procura

| Carta | Oferta? (S/N) | # offers | Preço min | Data check |
|-------|---------------|----------|-----------|------------|
| Encantada (expansão atual — slot 1) | | | | |
| Encantada (expansão atual — slot 2) | | | | |
| Stitch – Rock Star | | | | |
| Elsa – Spirit of Winter | | | | |
| Mickey / Winnie / Ariel (mais pedida do momento) | | | | |

Completar até ~20 cartas com o metagame / procura local do beta.

**Meta Sprint 8 → 9:** ≥80% do top ~20 com **≥1 oferta**.  
300 listings irrelevantes **não** substituem staples vazios.

---

## 4. Buyer pulse (teste inverso)

Além do seller publicar, rodar **teste comprador cego**:

> “Encontre *Rapunzel – Gifted with Healing* e veja se consegue comprar.”

Medir:

```text
search → PDP → offers → cart
```

| Sessão | Tempo até oferta | Abandonou em | Dúvida |
|--------|------------------|--------------|--------|
| | | | |

Marketplace morre mais por **“não encontrei nada”** do que por **“não consegui cadastrar”**.

Script completo: [`BETA_INTERVIEW_SCRIPT.md`](./BETA_INTERVIEW_SCRIPT.md)

---

## 5. Go / No-Go Sprint 9 (referência rápida)

**Antes:** Liquidity Proof repetido (A publica · B encontra · cart) sem intervenção.

| Eixo | Critério | OK? |
|------|----------|-----|
| **LPC** | ≥1 Liquidity Proof (buyer ≠ seller) | |
| **LCS** | ≥80% | |
| Supply | ≥5 lojas especializadas ativas | |
| Supply | 150–300 listings relevantes | |
| Seller | 2ª sessão sem ajuda + intent positivo útil | |

**Regra:** qualidade do supply Lorcana &gt; volume bruto. Stripe em vazio ≠ marketplace. LPC=0 ⇒ não avance para payment.

---

## 6. Log rápido do dia

| Data | Verde / Amarelo / Vermelho | Um parágrafo |
|------|----------------------------|--------------|
| | | |
