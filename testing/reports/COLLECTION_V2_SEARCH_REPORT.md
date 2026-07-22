# COLLECTION_V2_SEARCH_REPORT

**Persona:** Eduardo (Search / SEO)  
**Gerado:** 2026-07-22  

## Rotas

| Rota | Indexável | Canonical / robots |
|------|-----------|--------------------|
| `/colecao` | Não (área autenticada) | `robots: noindex` + `withCanonical` |
| `/colecao/*` | Não | herda layout |
| `/perfil/colecao` | Redirect → `/colecao` | 307/308 Next redirect |

## Performance

- Insights BFF: enrichment limitado (`MAX_PRICE_ENRICH=80`, history sample) para não estourar serverless.
- UI: skeletons + lazy panels; chart SVG leve.
- Lighthouse ≥90: meta; não medido em prod nesta rodada.

## Veredito Eduardo

**APROVADO** para área privada (noindex correto). Não compete com SEO público de portais/PDP.
