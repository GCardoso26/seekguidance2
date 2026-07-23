# NOTIFICATION_CENTER_V2 — Acceptance

**Date:** 2026-07-22  
**Epic:** 12 — Notification Center

## Verdict

**PASS** — Central única com group / unread / priority / action / deep link. Alimentada por Domain Events via BFF existente (sem polling inventado).

## Criteria

| Item | Status |
|------|--------|
| Grouped + priority + action | ✅ `lib/notifications/center.ts` |
| UI V2 | ✅ `NotificationsPage.tsx` |
| Feature flag | ✅ `NOTIFICATION_CENTER_V2` |
| Sem novo BC | ✅ |
