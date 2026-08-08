# CWM — Fase 5.1 Production Report

**Status do código:** CODE READY + PRODUCTION CONTROLLED (instrumentação)  
**Status da evidência:** ⏳ REAL EVIDENCE PENDING — não declarar REAL PROVEN sem checklist abaixo.

Preencher após o primeiro experimento real. Não inventar métricas.

---

## ENVIRONMENT

| Item | Valor |
|------|-------|
| Data | |
| Workspace ID | |
| API base | |
| Operator | |
| Niche | |
| Platform | YouTube |
| `AUTOMATION_MODE` during window | |

## PREFLIGHT

| Check | Result |
|-------|--------|
| Database | |
| Credential encryption | |
| YouTube OAuth client | |
| YouTube connection | |
| Content package | |
| Storage | |
| Publishing service | |
| Analytics provider | |
| Overall | READY / NOT_READY |

Notas (sem secrets):

## OAUTH

| Item | Valor |
|------|-------|
| Connection status | |
| Last verified | |
| Account label | |
| Tokens exposed in UI/API? | No (obrigatório) |

## DRY RUN

| Item | Valor |
|------|-------|
| Executado antes do real? | |
| Would publish? | |
| Title | |
| Duration | |
| File | |
| Thumbnail | |
| Upload occurred? | **No** (obrigatório) |

## PUBLICATION

| Item | Valor |
|------|-------|
| `publication_run_id` | |
| `content_id` | |
| `approved_by` | |
| `approved_at` | |
| `publication_source` | REAL |
| `upload_outcome` | |
| `published_at` | |

## EXTERNAL ID

| Item | Valor |
|------|-------|
| `external_id` | |
| `external_url` | |
| Remotely verified? | |
| UNKNOWN path used? | |

## ANALYTICS

| Item | Valor |
|------|-------|
| Workflow / trigger | WF 14 / manual |
| `metrics_source` | YOUTUBE |
| First snapshot at | |

## METRICS SNAPSHOTS

| Window | Views | Completion | AVD | Engagement | Shares | Saves | Followers | Clicks |
|--------|-------|------------|-----|------------|--------|-------|-----------|--------|
| 1h | | | | | | | | |
| 6h | | | | | | | | |
| 24h | | | | | | | | |
| 48h | | | | | | | | |
| 7d | | | | | | | | |

Ausente = `null` (nunca fabricar 0).

## WINNER

| Item | Valor |
|------|-------|
| State | INSUFFICIENT_DATA / TRACKING / … |
| Score | |
| Strong winner declared? | **No** (1 evidence) |

## STRATEGY

| Item | Valor |
|------|-------|
| `data_origin` | REAL |
| Status | hypothesis |
| Patterns noted | |
| Strong recommendation? | **No** unless evidence ≥ 3 |

## FEEDBACK LOOP

| Item | Valor |
|------|-------|
| Research feedback applied? | |
| Mock data mixed in? | **No** |

## SAFETY

| Flag after experiment | Expected |
|-----------------------|----------|
| Kill switch | true |
| Publishing enabled | false |
| YouTube publishing | false |
| Dry run | true |
| Daily limit | 1 |
| Restored at | |

## FAILURES

| Scenario | Observed | Duplicate publish? | Safety bypass? |
|----------|----------|--------------------|----------------|
| OAuth expired | | | |
| Upload timeout / UNKNOWN | | | |
| Analytics unavailable | | | |
| 429 / quota | | | |
| Network error | | | |

## TESTS / N8N (code gates)

| Gate | Result |
|------|--------|
| `npm test` | |
| `npm run n8n:validate` | |

## REAL EVIDENCE checklist (conclusão 5.1)

- [ ] preflight real executado
- [ ] OAuth real conectado
- [ ] dry-run executado
- [ ] human approval registrado (`approved_by`)
- [ ] 1 publicação REAL
- [ ] external ID confirmado remotamente
- [ ] ≥ 1 snapshot REAL
- [ ] `data_origin=REAL`
- [ ] winner / insufficient-data processado
- [ ] strategy hypothesis gerada
- [ ] safety defaults restaurados

## REMAINING GAPS

-

## NEXT STAGE

Após REAL PROVEN com 1 vídeo → planejar experimento de **3 vídeos** (hipóteses A/B/C, mesmas constantes de nicho/formato/duração).  
Sem monetização até haver tração real.
