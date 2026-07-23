# RELEASE_READINESS_FINAL

**Date:** 2026-07-23 (V6.4 reopen)  
**Status:** **READY FOR PRODUCTION = FALSE**

V6.3 havia fechado o gate. A certificação V6.4 (regressões funcionais em produção) **reabriu** o gate até evidência pós-deploy.

| Criterion | Pass? |
|-----------|:-----:|
| Contraste portais (V6.4-001) | ✅ código · ⏳ deploy |
| Filtros legíveis (V6.4-002) | ✅ código · ⏳ deploy |
| Imagens `_next/image` q=60/78 (V6.4-003) | ✅ código · ❌ prod ainda 400 |
| Rotas acessórios (V6.4-004) | ✅ código · ⏳ deploy |
| Marketplace produtos (V6.4-005) | ⚠️ singles OK · acessórios inventário |
| E2E funcional completo (V6.4-006) | ⏳ pós-deploy |
| Evidências V6.4 | ✅ reports gerados |

## READY_FOR_PRODUCTION = FALSE

Reabrir automático: regressões V6.4-001…003 reproduzidas em `judgetcg.com.br` (console).  
Fechar somente após deploy + checklist em `QA_PLATFORM_V6_4_FUNCTIONAL.md`.

Evidence: `QA_PLATFORM_V6_4_EVIDENCE.json`, `BUG_BACKLOG_V6_4.md`.
