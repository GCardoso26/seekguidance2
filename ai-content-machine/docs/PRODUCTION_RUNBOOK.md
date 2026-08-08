# CWM — Production Runbook (Fase 5.1)

Validação operacional controlada: **1 vídeo real → métricas reais → aprendizado**.

Não é escala. Não é monetização. Não é mass publishing.

## Princípio

| Estado | Significado |
|--------|-------------|
| **CODE READY** | Fase 5 implementada; mocks intactos; safety defaults ON |
| **PRODUCTION CONTROLLED** | Janela manual com flags abertas + daily limit = 1 |
| **REAL PROVEN** | External ID + snapshot REAL + hypothesis processada |

`REAL READY` (código) ≠ `REAL PROVEN` (evidência).

---

## 0. Pré-requisitos

- API CWM rodando
- Workspace criado
- Conteúdo com package `READY_FOR_PUBLISH`
- Secrets **nunca** no Git / frontend / logs / events

## 1. Configurar secrets (env)

```bash
export CWM_CREDENTIALS_ENCRYPTION_KEY='…32+ chars…'
export YOUTUBE_CLIENT_ID='…'
export YOUTUBE_CLIENT_SECRET='…'
export YOUTUBE_REDIRECT_URI='http://127.0.0.1:8787/api/publishing/connections/youtube/callback'
```

Defaults seguros (manter até o passo 8):

```bash
export GLOBAL_PUBLISHING_KILL_SWITCH=true
export PUBLISHING_ENABLED=false
export YOUTUBE_PUBLISHING_ENABLED=false
export DRY_RUN=true
export MAX_PUBLICATIONS_PER_DAY=1
export AUTOMATION_MODE=mock   # mock até a janela; use production + forceReal conforme setup
```

## 2. Validar environment (preflight)

```bash
curl -s "http://127.0.0.1:8787/api/validation/preflight?workspaceId=$WS&contentId=$CONTENT" | jq
```

Esperado: checks sem secrets. Status geral `READY` ou `NOT_READY`.  
**SAFE** (kill switch / dry-run) ≠ **READY TO PUBLISH**.

Automation Center → **Production Validation**.

## 3. Conectar YouTube

```bash
curl -s -X POST http://127.0.0.1:8787/api/publishing/connections/youtube/start \
  -H 'content-type: application/json' \
  -d "{\"workspaceId\":\"$WS\"}"
```

Abrir `authorizeUrl` no browser → consent → callback.

## 4. Verificar OAuth

```bash
curl -s "http://127.0.0.1:8787/api/publishing/youtube/status?workspaceId=$WS" | jq
```

Esperado: `CONNECTED`. Sem tokens na resposta.

## 5. Dry-run obrigatório

```bash
curl -s -X POST http://127.0.0.1:8787/api/validation/dry-run-report \
  -H 'content-type: application/json' \
  -d "{\"workspaceId\":\"$WS\",\"contentId\":\"$CONTENT\",\"platform\":\"YOUTUBE_SHORT\"}" | jq
```

Revisar **YouTube Pre-Publish Report** (title, file, thumbnail, duration, metadata).  
**Nenhum upload** deve ocorrer.

Ou via experimento:

```bash
curl -s -X POST http://127.0.0.1:8787/api/validation/experiments/$EXP/dry-run
```

## 6. Aprovar conteúdo

```bash
curl -s -X POST http://127.0.0.1:8787/api/publishing/approve-for-publish \
  -H 'content-type: application/json' \
  -d "{\"workspaceId\":\"$WS\",\"contentId\":\"$CONTENT\",\"approvedBy\":\"operator@nexus\"}"
```

Requer `approved_for_publishing=true` + `approved_by` + `approved_at`.

## 7–9. Abrir janela de publicação (curta)

Somente na janela controlada:

```bash
export GLOBAL_PUBLISHING_KILL_SWITCH=false
export PUBLISHING_ENABLED=true
export YOUTUBE_PUBLISHING_ENABLED=true
export DRY_RUN=false
export MAX_PUBLICATIONS_PER_DAY=1
```

Ou:

```bash
curl -s -X POST http://127.0.0.1:8787/api/validation/safety/open-window \
  -H 'content-type: application/json' \
  -d '{"confirm":"OPEN_PUBLISH_WINDOW","maxPublicationsPerDay":1}'
```

## 10. Publicar (1 vídeo)

```bash
curl -s -X POST http://127.0.0.1:8787/api/publishing/run \
  -H 'content-type: application/json' \
  -d "{\"workspaceId\":\"$WS\",\"contentId\":\"$CONTENT\",\"platform\":\"YOUTUBE_SHORT\",\"await\":true,\"forceReal\":true}"
```

## 11. Verificar external publication

Não confiar só na resposta do upload:

```bash
curl -s -X POST http://127.0.0.1:8787/api/validation/experiments/$EXP/observe
```

Confirmar `external_id`, `external_url`, `upload_outcome`, existência remota.

### Se UNKNOWN

1. **Não** retry automático
2. `getPublication` / observe
3. Se existir → `PUBLISHED`
4. Se não existir e for seguro → `RETRY` manual
5. Registrar decisão no experimento

## 12–13. Analytics + snapshots

Reutilizar WF 13 / WF 14. Janelas: 1h · 6h · 24h · 48h · 7d.

Métrica ausente → `null` (nunca fabricar `0`).

Verificar:

- `publication_source = REAL`
- `metrics_source = YOUTUBE`
- `data_origin = REAL`

## 14–15. Winner + Strategy

Com **1** evidência:

- Winner: `INSUFFICIENT_DATA` / tracking / hypothesis — **não** STRONG WINNER
- Strategy: `hypothesis` apenas (`evidenceCount >= 3` para strong)

## 16. Registrar resultado

Preencher `docs/PHASE5_1_PRODUCTION_REPORT.md`.

Atualizar experimento → `ANALYZED` / `COMPLETED`.

## 17. Restaurar safety defaults (obrigatório)

Imediatamente após publish (sucesso ou falha):

```bash
curl -s -X POST http://127.0.0.1:8787/api/validation/safety/restore-defaults
```

Defaults:

| Flag | Valor |
|------|-------|
| `GLOBAL_PUBLISHING_KILL_SWITCH` | `true` |
| `PUBLISHING_ENABLED` | `false` |
| `YOUTUBE_PUBLISHING_ENABLED` | `false` |
| `DRY_RUN` | `true` |
| `MAX_PUBLICATIONS_PER_DAY` | `1` |

---

## Escada de evidência (pós 5.1)

| Estágio | Objetivo |
|---------|----------|
| 1 vídeo | Provar infraestrutura real |
| 3 vídeos | Comparar hipóteses (mesmo nicho/formato/duração) |
| 10 vídeos | Encontrar padrões |
| 30+ | Repetibilidade |
| Receita | Monetizar o que demonstrou tração |

## Não fazer nesta fase

TikTok / Instagram / Pinterest · ads · engagement fake · mass publish · monetização · subir daily limit.
