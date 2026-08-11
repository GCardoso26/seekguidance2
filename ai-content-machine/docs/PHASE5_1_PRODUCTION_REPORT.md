# CWM — Fase 5.1 Production Report

**Status do código:** CODE READY + PRODUCTION CONTROLLED  
**Status da evidência:** ✅ **REAL PROVEN (1 vídeo)** — upload YouTube confirmado + safety restaurada.  
Snapshots analytics / winner / strategy ainda podem ser preenchidos nas janelas 1h–7d.

Preencher após o primeiro experimento real. Não inventar métricas.

---

## ENVIRONMENT

| Item | Valor |
|------|-------|
| Data | 2026-08-11 |
| Workspace ID | `86e1e2c0-38a0-44cb-962f-2def3227f516` |
| API base | `http://164.152.28.87:8787` (OCI) |
| Operator | `operator@nexus` |
| Niche | IA + produtividade + dinheiro digital |
| Platform | YouTube Short (`YOUTUBE_SHORT`) |
| `AUTOMATION_MODE` during window | `mock` (wrapper); publish path `forceReal` → `publicationSource=REAL` |

## PREFLIGHT

| Check | Result |
|------|--------|
| Database | PASS |
| Credential encryption | PASS |
| YouTube OAuth client | PASS |
| YouTube connection | PASS (`CONNECTED`, refresh ok) |
| Content package | PASS (`READY_FOR_PUBLISH`, assets em `/data/assets`) |
| Storage | PASS |
| Publishing service | PASS |
| Analytics provider | PASS |
| Overall | READY (infra) + janela aberta só no publish |

Notas (sem secrets): dry-run com `validation.ok=true` / `videoExists=true` antes do upload.

## OAUTH

| Item | Valor |
|------|-------|
| Connection status | CONNECTED |
| Last verified | 2026-08-11T17:16:34.798Z |
| Account label | null |
| Tokens exposed in UI/API? | No (obrigatório) |

## DRY RUN

| Item | Valor |
|------|-------|
| Executado antes do real? | Yes |
| Would publish? | Yes (`validation.ok`, `packageOk`) |
| Title | Ninguém te mostrou isso sobre IA + produtividade + dinheiro digital: ferramentas que economizam 2h/d |
| Duration | ~3s (package mock compose; brief 35s) |
| File | `/data/assets/.../final/final-v1.mp4` (presente) |
| Thumbnail | `/data/assets/.../thumbnails/thumb-v1.png` (presente) |
| Upload occurred? | **No** (obrigatório) |

## PUBLICATION

| Item | Valor |
|------|-------|
| `publication_run_id` | `f3c17638-a360-477b-84bd-369543e92bf7` |
| `content_id` | `bc1fbead-d60e-4fe9-902e-9e00d35dc5ac` |
| `approved_by` | `operator@nexus` |
| `approved_at` | 2026-08-11T18:39:51.056Z |
| `publication_source` | REAL |
| `upload_outcome` | SUCCESS |
| `published_at` | 2026-08-11T18:40:12.843Z |

## EXTERNAL ID

| Item | Valor |
|------|-------|
| `external_id` | `ouHb2NDU2gM` |
| `external_url` | https://www.youtube.com/watch?v=ouHb2NDU2gM |
| Remotely verified? | Upload API confirmed (`youtube_upload_confirmed`); privacy unlisted |
| UNKNOWN path used? | No |

## ANALYTICS

| Item | Valor |
|------|-------|
| Workflow / trigger | WF 14 / `POST /api/analytics/sync` `preferReal:true` |
| Bug observado (pré-fix) | Sync gravava `MOCK` (views 800) mesmo com `preferReal` — `preferReal` não era passado a `captureSnapshot` e `AUTOMATION_MODE=mock` bloqueava YouTube |
| Fix | Commit na branch: passar `preferReal`; REAL se `preferReal` **ou** `publication_source=REAL` + YouTube + `external_id` (sem gate de mock mode); fallback MOCK se API YouTube falhar |
| `metrics_source` esperado pós-deploy | `YOUTUBE` (`reality: REAL`) |
| First snapshot MOCK | `ea021b5f-70a0-463f-9bc0-ad0404d344cc` (2026-08-11T18:41:59Z) — manter histórico |
| First snapshot REAL | ⏳ após `git pull` + rebuild `api` + re-sync abaixo |

### Re-sync na OCI (após deploy do fix)

```bash
cd ~/seekguidance2 && git pull
cd ai-content-machine && docker compose build api && docker compose up -d api

curl -s -X POST http://127.0.0.1:8787/api/analytics/sync \
  -H 'content-type: application/json' \
  -d '{"workspaceId":"86e1e2c0-38a0-44cb-962f-2def3227f516","publicationId":"f3c17638-a360-477b-84bd-369543e92bf7","preferReal":true,"await":true}'

curl -s "http://127.0.0.1:8787/api/analytics/workspaces/86e1e2c0-38a0-44cb-962f-2def3227f516/snapshots" \
  | jq '[.snapshots[] | select(.publication_id=="f3c17638-a360-477b-84bd-369543e92bf7")] | .[0] | {id, metrics_source, reality, source, views, completion_rate, created_at}'
```

Esperado: `metrics_source: "YOUTUBE"`, `reality: "REAL"`. Views `0` cedo = normal (`WAITING_FOR_METRICS`).

## METRICS SNAPSHOTS

| Window | Views | Completion | AVD | Engagement | Shares | Saves | Followers | Clicks |
|--------|-------|------------|-----|------------|--------|-------|-----------|--------|
| 1h | null | null | null | null | null | null | null | null |
| 6h | null | null | null | null | null | null | null | null |
| 24h | null | null | null | null | null | null | null | null |
| 48h | null | null | null | null | null | null | null | null |
| 7d | null | null | null | null | null | null | null | null |

Ausente = `null` (nunca fabricar 0).

## WINNER

| Item | Valor |
|------|-------|
| State | INSUFFICIENT_DATA (1 evidence) |
| Score | — |
| Strong winner declared? | **No** (1 evidence) |

## STRATEGY

| Item | Valor |
|------|-------|
| `data_origin` | REAL (quando analyze rodar) |
| Status | hypothesis |
| Patterns noted | — |
| Strong recommendation? | **No** unless evidence ≥ 3 |

## FEEDBACK LOOP

| Item | Valor |
|------|-------|
| Research feedback applied? | Pending |
| Mock data mixed in? | **No** (publication REAL) |

## SAFETY

| Flag after experiment | Expected |
|-----------------------|----------|
| Kill switch | true |
| Publishing enabled | false |
| YouTube publishing | false |
| Dry run | true |
| Daily limit | 1 |
| Restored at | 2026-08-11T18:40Z (imediato pós-publish) |

## FAILURES

| Scenario | Observed | Duplicate publish? | Safety bypass? |
|----------|----------|--------------------|----------------|
| OAuth expired | Mitigado com `/youtube/refresh` | No | No |
| Upload timeout / UNKNOWN | No | No | No |
| Analytics unavailable | Sync pré-fix caía em MOCK fabricado; pós-fix tenta YouTube com `preferReal` | No | No |
| 429 / quota | No | No | No |
| Network error | No | No | No |
| Assets efêmeros / ABI sqlite | Resolvidos (`/data/assets`, rebuild better-sqlite3) | No | No |

## TESTS / N8N (code gates)

| Gate | Result |
|------|--------|
| `npm test` | 70/70 (branch) |
| `npm run n8n:validate` | 15/15 VALID |

## REAL EVIDENCE checklist (conclusão 5.1)

- [x] preflight real executado
- [x] OAuth real conectado
- [x] dry-run executado
- [x] human approval registrado (`approved_by`)
- [x] 1 publicação REAL
- [x] external ID confirmado (upload API)
- [ ] ≥ 1 snapshot REAL
- [ ] `data_origin=REAL` em strategy
- [ ] winner / insufficient-data processado
- [ ] strategy hypothesis gerada
- [x] safety defaults restaurados

## REMAINING GAPS

- Deploy do fix analytics na OCI → re-sync `preferReal` → preencher snapshot REAL neste relatório
- Rodar winner + strategy com origem REAL (sem strong winner com 1 evidência)
- Confirmar no Studio YouTube o vídeo unlisted `ouHb2NDU2gM`

## NEXT STAGE

Após snapshots REAL nas primeiras janelas → planejar experimento de **3 vídeos** (hipóteses A/B/C).  
Sem monetização até haver tração real.
