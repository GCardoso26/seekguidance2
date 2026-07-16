# Foundation Operations — JudgeTCG

**Status:** Congelado — Sprint 6  
**Escopo:** Observabilidade · confiabilidade · operação · recuperação  
**Não inclui:** features comerciais · novos TCG · IA · UX

## Princípio

```text
Build → Deploy → Observe → Detect → Recover
```

O fluxo vertical 90D (Provider → Catalog → Search → Marketplace → Checkout → Reservation → Payment → Order) está validado.  
Sprint 6 **não** altera bounded contexts — só torna o sistema operável.

## Cadeia operacional

```text
Application Services
  → MetricsRegistry (Prometheus text)
  → /metrics scrape
  → Grafana dashboards
  → Prometheus alerts
  → Runbooks / Incident Response
```

## Superfícies HTTP

| Path | Uso |
|------|-----|
| `GET /health` | Resumo (live + ready) |
| `GET /health/live` | Processo vivo |
| `GET /health/ready` | Postgres · Redis · Meilisearch · Outbox |
| `GET /metrics` | Exposition Prometheus |

## Artefatos

| Artefato | Path |
|----------|------|
| SLOs | [`SLO.md`](./SLO.md) |
| Runbooks | [`RUNBOOKS.md`](./RUNBOOKS.md) |
| Incident response | [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md) |
| Backups | [`BACKUP_POLICY.md`](./BACKUP_POLICY.md) |
| Alertas | `infra/prometheus/alerts.yml` |
| Dashboards | `infra/grafana/dashboards/` |

## Perguntas que devem ser respondíveis em ~30s

1. Qual worker caiu?
2. Qual provider está degradado?
3. Qual fila travou?
4. Qual Outbox está atrasado?
5. Qual migration foi aplicada?

## Smoke operacional

```bash
npm run smoke:production-readiness
npm run smoke:golden-path
npm run test:chaos
```
