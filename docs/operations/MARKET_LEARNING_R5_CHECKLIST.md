# R5 — Funnel observation checklist

**Pré-requisito:** janela R4 com usuários reais (sem seed como prova).  
**Fonte:** [`MARKET_LEARNING_R5.md`](./MARKET_LEARNING_R5.md)

## Funil a observar (Lorcana)

```text
busca → PDP → CTR oferta → add cart → abandono → checkout
```

| Etapa | Fonte de evidência | Observado? | Nota |
|-------|--------------------|------------|------|
| busca | analytics `search` / `search_used` | | |
| PDP | `buyer_card_open` / `card_view` | | |
| ofertas | `buyer_offers_viewed` (offerCount ≥ 1) | | |
| add cart | `buyer_add_to_cart` | | |
| abandono | sessões com cart sem checkout | | |
| checkout | `checkout_started` / completed | | |

## Heatmaps / comportamento (mínimo)

| Pergunta | Como registrar |
|----------|----------------|
| Quais filtros usam? | Notas + analytics search |
| Quais cartas procuram? | Top queries / DC50 |
| Onde abandonam? | Funil acima |
| Quanto tempo ficam? | `card_dwell_ms` |

## Saída para MRB

```text
evidência → decisão → ENGINEERING_PRIORITY_QUEUE (só problema observado)
```
