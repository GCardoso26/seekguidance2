# ASSET_PLATFORM_V2 — Performance

**Date:** 2026-07-22

## Non-blocking guarantees

- All manufacturer/publisher ingest remains on BullMQ `catalog.sync.*`
- Scheduler tick only enqueues; workers perform I/O
- SHA-256 dedup prevents re-upload storms
- Source trust skips lower-priority re-ingest
- Liga / Drive remain feature-flagged off by default
- FE auto-select uses existing CDN URL from search BFF — no sync path on publish

## Lighthouse

No new heavy FE deps; Master Catalog adds radio + banner copy only. Expect no regression vs Asset Pipeline V2 UX baseline.
