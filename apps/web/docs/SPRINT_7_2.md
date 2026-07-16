# Sprint 7.2 — Buyer Search + PDP + Offers

**Status:** Entregue  
**App:** `apps/web`

## Hipótese

Comprador encontra carta oficial e entende imediatamente: **tenho esta carta + estas ofertas**, com Catalog ≠ Marketplace na UI.

## Rotas

| Rota | API |
|------|-----|
| `/` · `/search?q=` | `publicApi.search` → `GET /api/v1/search` |
| `/cards/:id` | `publicApi.getCard` + `marketplaceApi.getOffers` (queries **independentes**) |

## Contrato real (congelado)

Search responde com `hits[].card` (não `items`). Ofertas: `GET /api/v1/marketplace/cards/:id/offers` → `CardOffersResponse`.

## Estados PDP

| Situação | UX |
|----------|-----|
| Catalog loading | Carregando carta… |
| Catalog error | Não foi possível carregar esta carta. |
| Offers empty | Nenhuma loja possui esta carta atualmente. |
| Offers error | Catalog ok + «Ofertas indisponíveis temporariamente» |

## Analytics

`buyer_search` · `buyer_card_open` · `buyer_offers_viewed`

## Fora de escopo (bloqueado)

favoritos · ranking · IA · comparação · histórico · avaliação · chat · SEO avançado · filtros complexos

## Próximo

**7.3** Seller Portal (time-to-first-listing &lt; 60s)
