# Runbooks — JudgeTCG

**Status:** Congelado — Sprint 6 (+ Sprint 8 beta ops)  
**Relaciona:** [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md) · alertas em `infra/prometheus/alerts.yml`

### Beta lojas (Sprint 8)

- [`BETA_WAVE1_OPERATION_PROTOCOL.md`](./BETA_WAVE1_OPERATION_PROTOCOL.md) — **protocolo Onda 1 (antes dos convites)**  
- [`BETA_REPORT_0_BASELINE.md`](./BETA_REPORT_0_BASELINE.md) — Report #0 baseline  
- [`SELLER_BETA_ONBOARDING_RUNBOOK.md`](./SELLER_BETA_ONBOARDING_RUNBOOK.md) — convite · kit · ativação  
- [`BETA_COMMAND_CENTER.md`](./BETA_COMMAND_CENTER.md) — visão diária da equipe (≤5 min)  
- [`BETA_WEEKLY_REPORT_TEMPLATE.md`](./BETA_WEEKLY_REPORT_TEMPLATE.md) — relatório semanal  
- [`BETA_INTERVIEW_SCRIPT.md`](./BETA_INTERVIEW_SCRIPT.md) — entrevistas seller/buyer  

---

## RUNBOOK-001 — Outbox acumulando eventos

**Alerta:** `OutboxOldestEventAge` (CRITICAL se &gt; 5 min)

### Sintomas
- `outbox_pending_events` sobe
- `outbox_oldest_event_age_seconds > 300`
- Search / projections atrasadas

### Passos
1. Verificar worker publisher (`worker:outbox` / processo ativo).
2. Verificar Redis (broker de publish) — conectividade e memória.
3. Inspecionar `platform.outbox_events` status `pending` / `leased` / `dead`.
4. Se publisher morto → restart (RUNBOOK-004).
5. Após recovery: confirmar `outbox_pending_events → 0` e backlog published.
6. Se `dead` &gt; 0 → inspecionar payload / maxAttempts; replay manual só com correlação.

### Validação
```bash
# pending deve cair; oldest age < 60s
curl -s localhost:8790/metrics | grep outbox_
```

---

## RUNBOOK-002 — Search atrasado

**Alerta:** `SearchProjectionLag`

### Sintomas
- `search_projection_lag_seconds > 60`
- Ofertas / cards não aparecem após publish

### Passos
1. Verificar Search consumer / Projection Manager.
2. Verificar Meilisearch health e disk.
3. Confirmar Outbox não é a causa (RUNBOOK-001).
4. Replay projection se necessário (rebuild via ProjectionManager — índice é derivado).
5. Validar `GET /api/v1/marketplace/cards/:id/offers` após catch-up.

---

## RUNBOOK-003 — Pagamento preso

**Alerta:** `PaymentPendingTooLong`

### Sintomas
- `payment_pending_total` alto
- Checkout em `PAYMENT_PENDING` &gt; 30 min

### Passos
1. Localizar `payment.payments` com `status = REQUESTED`.
2. Verificar se webhook Fake/Stripe chegou (`payment.payment_events`).
3. Se webhook perdido → reenviar simulação / reconciliar via `queryPayment`.
4. Nunca marcar AUTHORIZED sem evidência de provider.
5. Se TIMEOUT de provider → manter PENDING (sem auto-cancel — Sprint 5.5).

---

## RUNBOOK-004 — Worker morto

### Sintomas
- Health ready falha em `workers`
- Offsets / leases expirados
- Filas sem progresso

### Passos
1. Identificar worker (outbox / search / sync).
2. Restart do processo.
3. Validar consumer offsets preservados (idempotência).
4. Confirmar retomada: métricas `*_total` voltam a incrementar.
5. Se lease stuck → aguardar TTL ou reclaim.

### Validação
- Chaos C3 (`ops/chaos`) — offset preservado após restart.
