# Incident Response — JudgeTCG

**Status:** Congelado — Sprint 6

## Severidade

| Sev | Definição | Exemplo | Resposta |
|-----|-----------|---------|----------|
| **SEV-1** | Checkout/Payment quebrado ou perda de dados | Outbox dead massivo; oversell | Imediato · bridge |
| **SEV-2** | Degradação visível | Search lag &gt; 5 min; provider sync fail | &lt; 30 min |
| **SEV-3** | Impacto limitado | Latency budget breach | horário comercial |

## Fluxo

```text
Detect (alert / smoke)
  → Triage (sev + blast radius)
  → Mitigate (restart / feature flag / drain)
  → Diagnose (metrics · logs · runbook)
  → Recover
  → Postmortem (blameless) em 72h para SEV-1/2
```

## Fontes de detecção

1. Prometheus alerts (`infra/prometheus/alerts.yml`)
2. `npm run smoke:production-readiness` / periodic smoke
3. `/health/ready` failing
4. Relato de usuário (secundário)

## Comunicação

- SEV-1: status interno imediato + owner on-call
- Não prometer ETA sem evidência de métricas

## Pós-incidente (mínimo)

1. Timeline
2. Impacto (orders / listings afetados)
3. Causa raiz
4. Ações preventivas (alerta, teste, runbook)

## Referências

- [`RUNBOOKS.md`](./RUNBOOKS.md)
- [`SLO.md`](./SLO.md)
- [`BACKUP_POLICY.md`](./BACKUP_POLICY.md)
