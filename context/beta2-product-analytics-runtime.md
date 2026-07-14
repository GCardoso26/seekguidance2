# Beta 2 — Product Analytics Runtime

**Version:** 1.0.0  
**Status:** COMPLETE  
**Date:** 2026-07-14

## Summary

Delivered an independent Product Analytics Runtime that materializes **Data Marts** and exposes internal read APIs. Dashboards and KPIs no longer need to query `analytics_events` directly on the new path.

## Code

- `services/api/app/analytics_runtime/**`
- Router mounted in `app/main.py`
- Tests: `tests/analytics_runtime/test_runtime_engine.py` (11)
- Additive migration: `20260714180000_beta2_analytics_runtime_marts.sql`

## Docs

See `docs/product/RUNTIME_ENGINE.md`, `MATERIALIZED_DATA_MARTS.md`, `RUNTIME_API.md`, `BETA2_RUNTIME_REPORT.md`, and related runtime docs.

## Non-goals respected

No changes to marketplace/checkout/auth/AI/UI/public REST contracts/business rules.
