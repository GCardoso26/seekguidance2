# BUG_BACKLOG_V6_3

**Date:** 2026-07-23  
**Evidence:** `qa-platform-v6.3-evidence.json`

## Closed this campaign

| ID | Resolution |
|----|------------|
| **BUG-V6-004** | Root cause: `browserslist: last 2 * versions` shipped `next-devtools` (~212KiB unused) into prod. Fixed targets `chrome/edge/firefox >=111`, `safari >=16.4` + webpack strip + home LCP static hero / code-splitting. **Lighthouse all surfaces ≥95** after prod deploy. |
| **BUG-V6-011** | Chromium personas **21 PASS** @ production; Eduardo/Fernanda/Renato `certify-personas-ops` **ok:true** (BullMQ/Redis, admin, marketplace, search, portal, observability, deployments, load 1000). |

## Prior closed (still closed)

BUG-V6-010, BUG-V6-003, BUG-V6-005, BUG-V6-001/002

## Open

| Sev | Count |
|-----|------:|
| P0 | **0** |
| P1 | **0** |
| P2 | 2 (cross-browser matrix, full TCG provider E2E — non-blocking) |
| P3 | 1 (media.assets volume growth) |
