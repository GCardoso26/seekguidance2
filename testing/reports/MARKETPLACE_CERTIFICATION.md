# MARKETPLACE_CERTIFICATION

**Date:** 2026-07-22  
**Result:** **FAIL** (Knowledge Graph path) / **PARTIAL** (legacy shop inventory)

## Evidence

- `store_products` = 14878 (marketplace inventory exists).  
- `master_variant_id` preenchido = **0** → PDP não carrega Knowledge Panel / Related oficiais.  
- `media.assets` = 1 → assets oficiais de catálogo inexistentes na prática.

## Checks

| Check | Result |
|-------|--------|
| Listagens ativas | Dados existem |
| Override de imagem seller | Não revalidado E2E |
| Related products oficiais | Bloqueado (sem relationships + sem master id) |
| Lifecycle filters | Sem produtos master |
| Consistency multi-loja | Não executado (Fernanda load) |

## Bugs

BUG-V4-013 (P0), BUG-V4-001 (P0).
