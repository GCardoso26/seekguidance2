# Shorts pipeline

5–7 cenas. Preferência: 1 asset + motion + texto.

Exemplo 45s:

```
00–03  HOOK
03–08  CONTEXTO
08–15  PONTO 1
15–22  PONTO 2
22–30  PONTO 3
30–38  REVELAÇÃO
38–45  PAYOFF
```

`ScenePlannerService` deriva `visual_intent` + `search_queries` (EN) para stock.
Motion Ken Burns determinístico: `scene + sha256`.

API de domínio:

```
POST /api/shorts
GET  /api/shorts/:id
POST /api/shorts/:id/resume
POST /api/production/runs/:id/scenes/:scene/upload
GET  /api/studio/home
GET  /api/health/system
```

As rotas antigas (`/api/production/run`, `/api/scripts/generate`) continuam.
