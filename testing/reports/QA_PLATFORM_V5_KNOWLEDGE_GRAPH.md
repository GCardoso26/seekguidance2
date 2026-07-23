# QA_PLATFORM_V5_KNOWLEDGE_GRAPH

**Date:** 2026-07-23  
**Verdict:** **FAIL (escala) / PASS (E2E mock panel)**

## Evidence

| Node / metric | Count |
|---------------|------:|
| products / variants | 260 / 260 |
| publishers / manufacturers | 8 / 13 |
| collections | **0** |
| contents / specs / metadata | 1 / 1 / 3 |
| relationships / packages | **0 / 0** |
| master_variant links | **1 / 14878** |
| product_catalog RLS | 28/28 |
| E2E Knowledge Panel + unbound | **PASS** |

## Findings
- Código + empty states certificados em mock.  
- Grafo oficial **esparso**; Collections Portal sem dados.  
- BUG-V5-003 bloqueia aprovação de produção do KG no marketplace.

## Gate
Knowledge Graph **não validado** para produção.
