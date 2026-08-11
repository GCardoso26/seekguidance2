# CWM — Fase 5.1 Production Report

**Status do código:** CODE READY + PRODUCTION CONTROLLED  
**Status da evidência:** ✅ **REAL PROVEN (1 vídeo + snapshot YOUTUBE + winner INSUFFICIENT_DATA)**  
Strategy hypothesis exploratória: deploy do fix seguinte (sem WINNER → hipóteses a partir de pub REAL).

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
| `metrics_source` pós-deploy | `YOUTUBE` (`reality: REAL`) ✅ |
| First snapshot MOCK | `ea021b5f-70a0-463f-9bc0-ad0404d344cc` (2026-08-11T18:41:59Z) — histórico |
| First snapshot REAL | `4d06919a-19c0-4c02-bf62-a019d7fece6b` @ `2026-08-11T18:59:27.135Z` |
| Sync result | `status: COMPLETED`, `reality: REAL`, `count: 1` |
| Snapshot fields | `metrics_source=YOUTUBE`, `views=1`, `likes=0`, `comments=0`, `completion_rate=0` |

### Re-sync na OCI (executado)

Deploy `36966b54` + rebuild `api` + sync `preferReal:true` → **REAL** confirmado com 1 view YouTube.

Re-sync nas janelas 1h / 6h / 24h com o mesmo body `preferReal:true`.

## METRICS SNAPSHOTS

| Window | Views | Completion | AVD | Engagement | Shares | Saves | Followers | Clicks |
|--------|-------|------------|-----|------------|--------|-------|-----------|--------|
| ~20min (`4d06919a`) | 1 | 0 | 0 | — | 0 | 0 | 0 | 0 |
| 1h | null | null | null | null | null | null | null | null |
| 6h | null | null | null | null | null | null | null | null |
| 24h | null | null | null | null | null | null | null | null |
| 48h | null | null | null | null | null | null | null | null |
| 7d | null | null | null | null | null | null | null | null |

Ausente = `null` (nunca fabricar). `0` só quando o YouTube reportou 0.

## WINNER

| Item | Valor |
|------|-------|
| Execution | `dd51ea5b-c5a3-49d3-ad72-6adc1954f0b3` |
| State | `INSUFFICIENT_DATA` ✅ |
| Score | 0 |
| Metrics used | views=1 (snapshot YOUTUBE) |
| Envelope `reality` (pré-fix) | `MOCK` (hardcode automation) — corrigido no código para `REAL` quando pub/métricas REAL |
| Strong winner declared? | **No** |

## STRATEGY

| Item | Valor |
|------|-------|
| Execution (pré-fix) | `567a3f32-…` → `recommendations=[]` (só lia `performance_class=WINNER`) |
| Fix | Sem WINNER → hipóteses exploratórias de pubs `publication_source=REAL` + snapshot; `data_origin=REAL`; nunca strong |
| Status esperado pós-deploy | `hypothesis` / `reality: REAL` / `exploratory: true` |
| Strong recommendation? | **No** |

### Re-rodar após deploy do fix strategy/winner

```bash
cd ~/seekguidance2 && git pull
cd ai-content-machine && docker compose build api && docker compose up -d api

curl -s -X POST http://127.0.0.1:8787/api/winners/detect \
  -H 'content-type: application/json' \
  -d '{"workspaceId":"86e1e2c0-38a0-44cb-962f-2def3227f516","await":true}' | jq '{reality:.result.reality, state:.result.results[0].state, views:.result.results[0].metrics.views}'

curl -s -X POST http://127.0.0.1:8787/api/strategy/analyze \
  -H 'content-type: application/json' \
  -d '{"workspaceId":"86e1e2c0-38a0-44cb-962f-2def3227f516","await":true}' | jq '{reality:.result.reality, exploratory:.result.exploratory, hypotheses:(.result.hypotheses|length), strong:(.result.strong|length)}'
```

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
| `npm test` | 72/72 (branch) |
| `npm run n8n:validate` | 15/15 VALID |

## REAL EVIDENCE checklist (conclusão 5.1)

- [x] preflight real executado
- [x] OAuth real conectado
- [x] dry-run executado
- [x] human approval registrado (`approved_by`)
- [x] 1 publicação REAL
- [x] external ID confirmado (upload API)
- [x] ≥ 1 snapshot REAL (`4d06919a-…`, views=1 YOUTUBE)
- [ ] `data_origin=REAL` em strategy (após deploy fix exploratório)
- [x] winner / insufficient-data processado (`INSUFFICIENT_DATA`, score 0)
- [ ] strategy hypothesis gerada (após deploy fix exploratório)
- [x] safety defaults restaurados

## REMAINING GAPS

- Deploy fix winner/strategy reality + hipóteses exploratórias → re-rodar detect/analyze
- Re-sync analytics nas janelas 1h–7d
- Confirmar no Studio YouTube o vídeo unlisted `ouHb2NDU2gM`

## NEXT STAGE

Após snapshots REAL nas primeiras janelas → planejar experimento de **3 vídeos** (hipóteses A/B/C).  
Sem monetização até haver tração real.
