# PERFORMANCE_REPORT

**Date:** 2026-07-23

## Summary

| Area | Result |
|------|--------|
| HTTP load 100–1000 | **PASS** (see LOAD_TEST_REPORT) |
| Lighthouse Perf ≥95 all surfaces | **FAIL** (see LIGHTHOUSE_REPORT) |
| Redis 5 / BullMQ consume | PASS (~87ms job) |
| Checkout certify latency | cart create ~5ms (in-memory stack) |

## Infra notes

- Redis Windows 3.x on :6379 is **not** production-grade for BullMQ.
- Cert Redis: 5.0.14.1 on :6380.
- Supabase / R2 / Qdrant under load: not instrumented in this probe (HTTP edge only).

## Verdict

**PARTIAL** — load PASS; Lighthouse Perf gate FAIL.
