# Operating model

## Papéis

```
canal-dark  = cérebro (o quê, porquê, gates, retomada, aprovação, pacote)
CWM         = motor  (providers, library, compose, storage, publish, métricas)
```

A Skill decide: o que pesquisar, o que produzir, ângulo, estrutura do roteiro, direção visual, quais gates, quando retomar, quando pedir aprovação, qual pacote entregar.

O CWM executa: script, voz, visuais, Asset Library, composição, armazenamento, publishing, fallbacks, Quality Gates.

## Ciclo

```
INSPECT → PLAN → EXECUTE → VERIFY → REPORT
```

### INSPECT

- Procurar `contentId`, `productionId`, `version`, stages em `production_runs.result`.
- `GET /api/factory/status` e `scripts/inspect-cwm.mjs`.
- Se `VOICE=DONE` e `VISUALS=DONE` e `COMPOSING=FAILED` → retomar em `COMPOSING`.
- Nunca reconstruir a produção por defeito.

### PLAN

- `POST /api/editorial/dry-run` — sem chamadas destrutivas.
- Mostrar: stage, provider, expected output, dependencies, estimated work.
- Provider ausente → `NOT_CONFIGURED` (não inventar integração).

### EXECUTE

Somente rotas/serviços CWM. Briefing editorial (research/ideia/títulos/Visual Bible) nesta Skill; geração na fábrica.

### VERIFY

FILE / CONTENT / VISUAL / AUDIO / RIGHTS / YOUTUBE QA + `PublishingQualityGate`.

Regra dura: **Mock visual ↛ READY_FOR_PUBLISH**.

### REPORT

Artefactos verificáveis em disco + status honesto. Texto de monetização: ver `metadata.md`.
