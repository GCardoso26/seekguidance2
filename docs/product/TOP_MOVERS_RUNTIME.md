# TOP_MOVERS_RUNTIME.md

**Endpoint:** `GET /runtime/top-movers`

**Marts:** `mart_top_movers`, `mart_orders`, `mart_search`, `mart_catalog`, `mart_marketplace`, `mart_product_metrics`, `mart_product_health`

**Query:** `game`, `period`, `sort` (alta|queda|liquidez|volume), `foil`, `limit`

**Garantia:** leitura nunca toca `analytics_events` — apenas Data Marts materializados.

**BFF:** `GET /api/runtime/top-movers`
