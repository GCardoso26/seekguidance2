# QA_PLATFORM_V5_SECURITY

**Date:** 2026-07-23  
**Verdict:** **PARTIAL / FAIL gate**

## Evidence

| Area | Result |
|------|--------|
| `product_catalog` RLS | **28/28 ON**, anon USAGE=false |
| Admin product-catalog auth (V4 remediação) | Código com `require_admin` + BFF 401 — **não re-penetrado live** nesta V5 |
| Commerce schemas RLS | **OFF** (marketplace/payment/cart/reservation/platform) |
| anon USAGE commerce | false (mitigação) |
| Auth E2E full matrix | NOT_EXECUTED beyond subset |
| Rate limit / upload abuse | NOT_EXECUTED |
| PSP secrets in cert env | MISSING (não é vazamento; bloqueia live) |

## Findings
- BUG-V5-008 RLS commerce.  
- Sem pen-test; não marcar segurança “PASS” global.

## Gate
Segurança **não aprovada** integralmente.
