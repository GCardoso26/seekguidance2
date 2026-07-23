# BUG_BACKLOG_V6 — Production Readiness Certification

**Date:** 2026-07-23 (rev v6.1)  
**Evidence:** `qa-platform-v6-evidence.json`  
**Policy:** Zero Feature

## Closed / reframed this revision

| ID | Status |
|----|--------|
| BUG-V6-001 | **REFRAMED→closed as P0** — sleeves linkable **1/1**; singles 14877 fora do escopo accessory catalog; collection oficial criada (20 products) |
| BUG-V6-002 status semantics | **CLOSED** — soft-fail `image:`/`knowledge:`; run Gamegenic `completed` + `ok:true` |
| V5-001/002/005/006/008 | CLOSED (prior V6) |

---

## P0

*(nenhum)*

---

## P1

### BUG-V6-003 — Redis/BullMQ inacessível no ambiente local de certificação
- `REDIS_URL` → ECONNREFUSED; filas/DLQ NOT_EXECUTED.

### BUG-V6-004 — Lighthouse ≥95 e load 100–1000 não executados

### BUG-V6-005 — Checkout saga/webhook/refund/concorrência incompletos
- PSP API live PASS; fluxo pedido completo NOT_EXECUTED.

### BUG-V6-010 — Fetch de imagens do Asset Pipeline ainda falha
- Soft-fail evita marcar sync `failed`, mas `image:…:fetch failed` persiste; `media.assets` baixo.
- **Causa:** URL/rede/source das imagens manufacturer/central.

### BUG-V6-011 — Personas não 100% (PDV, relationships, ops Renato)
- Marina/Carlos parciais; Renato FAIL Redis/LH.

---

## P2

### BUG-V6-007 — Cross-browser / dark-light NOT_EXECUTED  
### BUG-V6-008 — Matriz providers TCG E2E completa NOT_EXECUTED  

---

## P3

### BUG-V6-009 — `media.assets` volume baixo apesar de upserts  

---

## Resumo

| Sev | Abertos |
|-----|---------|
| P0 | **0** |
| P1 | **5** |
| P2 | **2** |
| P3 | **1** |

**READY FOR PRODUCTION = FALSE** (P1 ≠ 0; Lighthouse/BullMQ/saga incompletos)
