# QA_PLATFORM_V5_PERSONAS

**Date:** 2026-07-23  
**Verdict:** **FAIL** — nenhuma persona plenamente aprovada

## Marina — Lojista
| Fluxo | Evidência | Status |
|-------|-----------|--------|
| Login → dashboard → CRUD produto → estoque → cupom → pedido → relatório | `seller-lifecycle.spec.ts` | **SKIPPED** (sem `seller.json` / `seed:test`) |
| PDV / KYC / analytics / coupons suites | Não reexecutadas nesta campanha | NOT_EXECUTED |
| Knowledge Panel / publish master link | SQL master_variant=1 | FAIL escala |

**Persona:** **NOT APPROVED**

## Carlos — Comprador
| Fluxo | Evidência | Status |
|-------|-----------|--------|
| Search page | `search.spec.ts` PASS | PASS smoke |
| Marketplace browse / wishlist screenshots | buyer-lifecycle (auth dependent) | PARTIAL/SKIP risk |
| Carrinho → PIX/Stripe/MP | PSP probe BLOCKED | **FAIL** |
| Knowledge Panel | e2e mock PASS | PASS mock only |

**Persona:** **NOT APPROVED**

## Juliana — Colecionadora
| Fluxo | Evidência | Status |
|-------|-----------|--------|
| KG panel / empty unbound | `product-knowledge-panel.spec.ts` PASS | PASS mock |
| Collections live | collections=0 | **FAIL** |
| Downloads / asset packages | packages=0 | **FAIL** |

**Persona:** **NOT APPROVED**

## Eduardo — Admin
| Fluxo | Evidência | Status |
|-------|-----------|--------|
| Provider registry | providers=89 | PASS count |
| Sync / scheduler health | sync_runs failed=79/79 | **FAIL** |
| Knowledge coverage / asset health live admin | NOT_EXECUTED live | NOT_EXECUTED |
| BullMQ/DLQ | NOT_EXECUTED | FAIL gate |
| product_catalog RLS | 28/28 | PASS |

**Persona:** **NOT APPROVED**

## Fernanda — Marketplace Manager
| Fluxo | Evidência | Status |
|-------|-----------|--------|
| Taxonomy / relationships / collections | relationships=0 collections=0 | **FAIL** |
| Filtros marketplace | E2E FAIL max_price + mobile | **FAIL** |
| Marketplace listings domain | listings=1 | PARTIAL |

**Persona:** **NOT APPROVED**

## Renato — Operações
| Fluxo | Evidência | Status |
|-------|-----------|--------|
| Deploy/rollback | NOT_EXECUTED | NOT_EXECUTED |
| Sync image pipeline | fetch failed nos errors | **FAIL** |
| Lighthouse / load | NOT_EXECUTED | **FAIL** gate |
| Redis/Qdrant/R2/CDN | NOT_EXECUTED | NOT_EXECUTED |

**Persona:** **NOT APPROVED**
