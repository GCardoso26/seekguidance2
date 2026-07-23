# BUG_BACKLOG_V6_2

**Date:** 2026-07-23  
**Evidence:** `qa-platform-v6.2-evidence.json`

## Closed

| ID | Notes |
|----|-------|
| BUG-V6-010 | Placeholder CDN `.example` → fixture/rewrite; sync Gamegenic `errors:[]`; vitest 8/8 |
| BUG-V6-003 | Redis 5.0.14.1 :6380; BullMQ live cert PASS |
| BUG-V6-005 | Checkout prod cert PASS (saga/webhook/idempotency/concurrency/live PSP) |
| BUG-V6-002 | (prior) soft-fail sync status |
| BUG-V6-001 | (prior) KG accessory scope reframed |

## P0

*(none)*

## P1 open

### BUG-V6-004 — Lighthouse Performance <95 on multiple surfaces
- Fail: `/` 88, `/loja/mtg` 91, cart 87, comprador 88, seller 92, estoque 94, decks 83
- Pass: `/loja` 98, busca 97, checkout 98
- A11y/SEO/BP ≥95 everywhere audited
- Top opportunity home: unused-javascript ~286KiB
- **Requires production deploy of frontend bundle reductions**

### BUG-V6-011 — Personas not 100%
- Chromium buyer+seller+filters+knowledge: **21 PASS**
- Mobile Chrome seller flake mitigated in `wait-panel.ts` (re-run pending)
- Eduardo/Fernanda/Renato full admin/UI paths not fully E2E

## P2

| ID | Notes |
|----|-------|
| BUG-V6-007 | Cross-browser matrix incomplete |
| BUG-V6-008 | Full TCG provider matrix E2E incomplete |

## P3

| ID | Notes |
|----|-------|
| BUG-V6-009 | media.assets volume still modest (10); grows with manufacturer syncs + real CDN |

## Counts

| Sev | Open |
|-----|-----:|
| P0 | 0 |
| P1 | **2** |
| P2 | 2 |
| P3 | 1 |
