# OBSERVABILITY_REPORT

**Date:** 2026-07-22  
**Veredito:** **PARTIAL**

## Presente

| Capacidade | Status | Evidência |
|------------|--------|-----------|
| `/health`, `/health/live`, `/health/ready` | ✅ | `observability/http/health.ts` |
| `/metrics` Prometheus | ✅ | `metrics.toPrometheusText()` |
| Logs estruturados (pino) | ✅ | `platform/logging/logger.ts` |
| requestId / correlationId | ✅ | outbox metadata + context |
| Checkout V2 postgres/outbox probes | ✅ após BUG-QA-001 | `postgresCheckoutHealthDeps` |

## Ausente / parcial

| Capacidade | Status |
|------------|--------|
| Redis PING no health Checkout V2 | ⚠️ opcional não wired |
| Dashboards Grafana versionados | ⚠️ |
| Alertas P0 (fila parada, worker morto, outbox lag) | ⚠️ não evidenciados |
| Tracing OTel end-to-end produção | ⚠️ parcial |
| Correlação orderId em todos os logs gateway | ⚠️ parcial |

## Critério “observabilidade completa”

**FALSE** até alertas + dashboards + health Redis/workers em deploy real.
