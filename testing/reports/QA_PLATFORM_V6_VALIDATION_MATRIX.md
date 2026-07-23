# QA_PLATFORM_V6_VALIDATION_MATRIX

**Date:** 2026-07-23  
**Source gaps:** `BUG_BACKLOG_V5.md` + `qa-platform-v5-evidence.json`  
**Policy:** Zero Feature — only validate / stabilize / fix / certify

Legend: ✅ evidence PASS · ❌ evidence FAIL · ⚠️ PARTIAL · 🚫 NOT_EXECUTED / BLOCKED

| Module | Unit | Integration | E2E | Smoke | Regression | Stress | Security | UX | Perf |
|--------|------|-------------|-----|-------|------------|--------|----------|----|------|
| Marketplace | ⚠️ | ⚠️ | ❌ filtros | ⚠️ | ❌ | 🚫 | ⚠️ | ❌ | 🚫 |
| Portal | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Checkout | ✅ adapters | ⚠️ | 🚫 | 🚫 | 🚫 | 🚫 | ⚠️ | 🚫 | 🚫 |
| Payments PIX/Stripe/MP | ✅ throws no token | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Product Catalog | ✅ | ⚠️ SQL | ⚠️ | ⚠️ | ⚠️ | 🚫 | ✅ RLS | ⚠️ | 🚫 |
| Knowledge Graph | ✅ | ❌ escala | ✅ mock | ⚠️ | ⚠️ | 🚫 | ✅ | ⚠️ | 🚫 |
| Search | ✅ boosts | 🚫 | ⚠️ smoke | ⚠️ | ❌ filtros | 🚫 | 🚫 | ❌ | 🚫 |
| Collections | ⚠️ | ❌ 0 rows | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Seller Panel | ⚠️ | 🚫 | 🚫 skip auth | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Buyer | ⚠️ | 🚫 | ⚠️ | ⚠️ | 🚫 | 🚫 | 🚫 | ⚠️ | 🚫 |
| Admin | ⚠️ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ⚠️ | 🚫 | 🚫 |
| Analytics | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Assets | ⚠️ | ❌ fetch | 🚫 | ❌ | ❌ | 🚫 | 🚫 | 🚫 | 🚫 |
| BullMQ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Redis | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Qdrant | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Supabase | ⚠️ SQL | ⚠️ | n/a | ⚠️ | n/a | 🚫 | ⚠️ | n/a | 🚫 |
| R2 / CDN | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Scheduler | ⚠️ | ❌ 79/79 fail | n/a | ❌ | ❌ | 🚫 | 🚫 | n/a | 🚫 |
| Workers | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Notifications | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Editorial | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Tournament | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| PDV | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Deck Builder | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Collection (buyer) | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

Initial status = V5 baseline before V6 execution. Updated in `qa-platform-v6-evidence.json`.
