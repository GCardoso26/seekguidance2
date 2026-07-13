# Changelog — Public Beta / RC1

## [Unreleased — RC1 blocker resolution] — 2026-07-13

### Fixed
- BFF `/api/health` 503 → 200 (schema `tcg_judge` + fallback API health)
- Smoke harness alinhado ao produto (loja title, redirects, expire-stale 401, UTF-8)
- `test_redis_ping_without_url` independente de REDIS_URL do host
- Lighthouse audit script (`lighthouse.default`) + URLs RC

### Release
- Evidências: health/smoke/lighthouse reports em `context/`
- **NO-GO** mantido (billing CI + Perf Lighthouse <95)

## [RC1 candidate / NO-GO] — 2026-07-13 (auditoria)

- Pacote canônico em `docs/release/`
- Tag `RC1` não criada
