# TOP_MOVERS_METRICS.md

| Sinal | Origem |
|-------|--------|
| GMV / volume mercado | mart_orders + mart_top_movers.summary |
| Product Health | mart_product_health |
| Gainers / Losers / Liquidity | mart_top_movers |
| Search activity | mart_search |

Eventos: `top_movers_open|filter|sort|card_open|buy_click|compare` (Event Registry + FE AnalyticsEventName).
