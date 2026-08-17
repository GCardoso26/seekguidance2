# Fase 5 — Audit

| Component | Existing | Reusable | Missing |
|-----------|----------|----------|---------|
| MockPublisher / MockAnalytics | ✓ | keep as mock path | — |
| YouTube adapter stub | ✓ NOT_CONFIGURED | replace with real | OAuth + upload |
| Publisher selection | hardcoded mock | wire by mode/flags | factory |
| OAuth / encryption | ✗ | HMAC webhook pattern | CredentialProvider + connections |
| Kill switch / dry-run / limits | ✗ | — | PublishingSafety |
| Human approval gate | WF 06 stub + approve API | reuse contents.approve | approvedForPublishing check |
| WF 08 analytics | ✓ | extend | real provider |
| WF 10 recycling / 11 monetization | occupied | do not overwrite | new WF 13/14 |

**Decisão:** YouTube-first; TikTok/IG/Pin remain NOT_CONFIGURED. Mocks never removed. New n8n `13` monitoring + `14` metrics windows (08 kept).
