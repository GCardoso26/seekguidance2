# Beta Command Center

**Sprint:** 8 — visão interna da equipe  
**Não é** dashboard de usuário / seller.  
**Objetivo:** em **≤5 minutos** saber se o marketplace está ganhando vida ou morrendo.  
**Relaciona:** [`SELLER_BETA_ONBOARDING_RUNBOOK.md`](./SELLER_BETA_ONBOARDING_RUNBOOK.md) · [`BETA_WEEKLY_REPORT_TEMPLATE.md`](./BETA_WEEKLY_REPORT_TEMPLATE.md) · [`BETA_INTERVIEW_SCRIPT.md`](./BETA_INTERVIEW_SCRIPT.md) · [`BETA_WAVE1_OPERATION_PROTOCOL.md`](./BETA_WAVE1_OPERATION_PROTOCOL.md)

Preencher diariamente (ou a cada check-in). **Primeiros 7 dias:** só observar + P0 — ver protocolo Onda 1.

---

## Checklist diário (5 min)

1. [ ] Supply Health — números vs meta  
2. [ ] Seller Activation — funil + depth + **intent** (`will_add_more` / maybe / no)  
3. [ ] Liquidity Watchlist — top cartas com oferta?  
4. [ ] Buyer pulse — alguém chegou em offers/cart?  
5. [ ] Algum P0 novo?  
6. [ ] Alguém **voltou sozinho** (2ª sessão)?  

**Liquidity Proof (marco):** desconhecido publica → outro busca → encontra oferta → cart — sem intervenção.


---

## 1. Supply Health

**Pergunta:** temos cartas vendáveis com oferta?

| Métrica | Hoje | Meta (onda 1) |
|---------|------|----------------|
| Lojas convidadas | | 30 |
| Lojas aceitas | | 10 |
| Lojas ativas (≥1 listing) | | 5 |
| Listings ativos | | 300–500 |
| Cartas com oferta | | crescente |

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

### Liquidity Watchlist (lista viva)

Atualizar com busca real no beta (`/search` → PDP → Ofertas).

#### Commander

| Carta | Oferta? (S/N) | # offers | Preço min | Data check |
|-------|---------------|----------|-----------|------------|
| Sol Ring | | | | |
| Arcane Signet | | | | |
| Command Tower | | | | |
| Cyclonic Rift | | | | |
| Rhystic Study | | | | |

#### Staples gerais

| Carta | Oferta? (S/N) | # offers | Preço min | Data check |
|-------|---------------|----------|-----------|------------|
| Lightning Bolt | | | | |
| Counterspell | | | | |
| Swords to Plowshares | | | | |
| Path to Exile | | | | |

**Meta Sprint 8 → 9:** top da watchlist (aprox. 20 cartas) com **≥1 oferta**.  
500 listings genéricos **não** substituem staples vazios.

---

## 4. Buyer pulse (teste inverso)

Além do seller publicar, rodar **teste comprador cego**:

> “Encontre uma Lightning Bolt e veja se consegue comprar.”

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
| Supply | ≥10 lojas cadastradas | |
| Supply | ≥5 lojas ativas | |
| Supply | 300–500 listings (não único gatilho) | |
| Liquidez | Top ~20 watchlist com oferta | |
| Buyer | Usuários chegam a offers / cart | |
| Seller | 2ª sessão sem ajuda + intent positivo útil | |

**Regra:** 500 cartas ruins &lt; 50 cartas certas. Stripe em vazio ≠ marketplace.

---

## 6. Log rápido do dia

| Data | Verde / Amarelo / Vermelho | Um parágrafo |
|------|----------------------------|--------------|
| | | |
