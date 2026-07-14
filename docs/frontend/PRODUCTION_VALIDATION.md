# Production Validation — RC1.2

**Data:** 2026-07-14

## Ambientes

| Ambiente | Build | A11y `/loja` | BP `/loja` | Perf `/loja` | Nota |
|---|---|---:|---:|---:|---|
| **Local lab** (`npm run start` pós-RC1.2) | este branch | **100** | **100** | **97** | Gates A11y/BP PASS |
| **Preview** | n/d nesta sessão | — | — | — | Não publicado nesta sprint |
| **Production** `judgetcg.com.br` (artefatos anteriores no dir LH) | pré-RC1.2 | **~93** | **96** | **~77** | **Ainda sem deploy RC1.1/RC1.2** |

## Diferenças Local vs Production

| Fator | Local RC1.2 | Production atual |
|---|---|---|
| Logos WebP + Store RSC | Sim | Não (ainda SVG/`next/image` pesado nos artefatos antigos) |
| Warning token WCAG | L~34% | Token antigo claro |
| Analytics soft-200 | Sim | Endpoint antigo 4xx/5xx |
| Catalog sets soft-200 | Sim | 503 quando API flaky |
| LCP Store | ~1.3s | ~4–5s (artefato antigo) |

## Conclusão operacional

Quality gates **passam em lab**. Production **não** reflete o código RC1.2 até commit + deploy + re-LH.

Checklist pós-deploy:

1. Ship branch RC1.1+RC1.2  
2. `npm run lighthouse` / LHCI contra URL prod  
3. Atualizar esta tabela com scores medidos  
4. Só então fechar tag RC1
