# JudgeTCG Beta Report — Template semanal

## Relatórios

| Report | Quando |
|--------|--------|
| **#0 Baseline** | Antes dos convites — [`BETA_REPORT_0_BASELINE.md`](./BETA_REPORT_0_BASELINE.md) |
| **#1+** | Semanal / fim da 1ª semana — template abaixo |

**Protocolo Onda 1:** [`BETA_WAVE1_OPERATION_PROTOCOL.md`](./BETA_WAVE1_OPERATION_PROTOCOL.md)  
Separar sempre **Grupo A vs B** nas taxas. Incluir funil **convite → interessado → entrou → publicou**.

---

## JudgeTCG Beta Report #__

**Período:** ____ / ____ / ______ → ____ / ____ / ______  
**Autor:** _______________

### Oferta

| Métrica | Valor | Grupo A | Grupo B |
|---------|-------|---------|---------|
| Lojas convidadas (acum.) | | | |
| Responderam interessados | | | |
| Entraram no beta | | | |
| Lojas cadastradas | | | |
| Lojas ativas (≥1 listing) | | | |
| Listings ativos | | | |
| Cartas com oferta | | | |
| Média listings/loja (depth) | | | |

### Funil convite (primeira observação)

```text
convite enviado
  ↓ __%
respondeu interessado
  ↓ __%
entrou no beta
  ↓ __%
publicou
```

### Intent + retorno

| Métrica | Valor |
|---------|-------|
| `seller_intent_after_first_listing` will_add_more / maybe / no | |
| Voltaram sozinhos (2ª sessão) | |

### Hipótese do lote (copiar do protocolo)

> _______________________________________________

### Diagnóstico mercado vs produto

- [ ] Caso A — convite (não mexer produto)  
- [ ] Caso B — ativação/UX  
- [ ] Caso C — liquidez/demanda  

### Seller Funnel

```text
100%  seller_portal_visit (ou base da semana)
  ↓ __%
Criou conta (seller_signup_completed)
  ↓ __%
Criou loja (seller_shop_created)
  ↓ __%
Publicou anúncio (seller_listing_published)
```

| Taxa | Valor |
|------|-------|
| shop_created → listing_published | |
| signup_completed → listing_published | |
| P50 `seller_time_to_first_listing_ms` | |
| P95 `seller_time_to_first_listing_ms` | |

### Buyer Funnel

```text
buyer_search
  ↓ __%
buyer_card_open
  ↓ __%
buyer_offers_viewed
  ↓ __%
buyer_add_to_cart
  ↓ __%
buyer_checkout_started
```

### Liquidez (spot check) — ver Command Center

Preencher Liquidity Watchlist em [`BETA_COMMAND_CENTER.md`](./BETA_COMMAND_CENTER.md).

| Carta | Tem oferta? |
|-------|------------|
| Sol Ring / Arcane Signet / Command Tower / … | |
| Lightning Bolt / Counterspell / Swords / Path | |

### Seller depth

| Média listings/loja ativa (hoje) | |
| Média D+7 | |


### Problemas encontrados

| ID | Severidade | Descrição | Ação |
|----|------------|-----------|------|
| | P0 / P1 / P2 | | |

**P0** — impede venda (não publica · oferta não aparece)  
**P1** — reduz conversão (condição confusa · não sabe onde clicar)  
**P2** — melhoria (layout · texto)

### Decisões da semana

- Continuar convites?  
- Corrigir fricção (qual)?  
- Bloquear pedido de CSV/dashboard/SEO? (padrão: sim)

### Próxima semana

1.  
2.  
3.  
