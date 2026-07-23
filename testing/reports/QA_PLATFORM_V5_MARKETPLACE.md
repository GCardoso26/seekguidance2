# QA_PLATFORM_V5_MARKETPLACE

**Date:** 2026-07-23  
**Verdict:** **FAIL**

## Evidence

| Check | Result |
|-------|--------|
| `store_products` | 14878 |
| `master_variant_id` filled | **1** |
| `marketplace.listings` | 1 |
| Home/search smoke E2E | PASS (`search.spec.ts`) |
| Filtros preço / mobile | **FAIL** (BUG-V5-005/006) |
| Knowledge Panel em PDP real escala | FAIL (vínculo 1/14878) |
| Seller publish lifecycle | SKIPPED |

## Findings
- Regressão filtros (URL `max_price` + apply mobile).  
- Overlay master catalog quase ausente nas listagens shop.  
- Domain `marketplace.listings` quase vazio vs shop legado cheio → dual-path não unificado.

## Gate
Marketplace **não validado** para produção.
