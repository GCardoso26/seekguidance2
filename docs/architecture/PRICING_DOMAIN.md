# Pricing Domain

Bounded context **separado** do Catalog. Fluxo alvo:

```
Catalog → Pricing → Marketplace → Search → Analytics
```

## Responsabilidades

Consumir mercados externos e ofertas internas; produzir valuation canônica:

| Métrica | Descrição |
|---------|-----------|
| min / avg / median | Agregados por subject |
| suggested | Média ponderada por mercado |
| spread_bps | Spread relativo entre mins |
| liquidity_score | Liquidez (sellers / sample) |
| history | `pricing.price_quote_history` |

## Subjects

- `catalog_card`
- `catalog_variant`
- `product_variant` (Catálogo Mestre)

## Providers

| Market | Env |
|--------|-----|
| TCGPLAYER | `TCGPLAYER_API_KEY` |
| CARDMARKET | `CARDMARKET_APP_TOKEN` |
| CARDTRADER | `CARDTRADER_TOKEN` |
| EBAY | `EBAY_APP_ID` |
| JUDGETCG | ofertas `seller_products` (sempre) |

Stubs HTTP aguardam credenciais; `JudgeTcgPricingProvider` já agrega ofertas internas.

## API

- `GET /runtime/judge/pricing/valuation/{subject_type}/{subject_id}`
- `GET /runtime/judge/pricing/history/{subject_type}/{subject_id}`

## CLI

```bash
npm run pricing:sync --prefix services/api -- product_variant <uuid>
```

## Eventos

`PriceChanged` → `platform.domain_events`
