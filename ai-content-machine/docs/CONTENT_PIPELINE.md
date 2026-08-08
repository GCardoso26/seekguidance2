# Content Pipeline

```
Research Engine → Topics → Ideas → Script Factory → Scripts
→ Content Production → Media QA → Content Package (READY_FOR_PUBLISH)
→ (next) Publishing Engine → Analytics → Winner → Recycling → Monetize
```

## Independência (Fase 2–3)

| Pipeline | Trigger API | n8n | Mock runner |
|----------|-------------|-----|-------------|
| Research | `/api/research/run` | WF 02 | ResearchService |
| Script Factory | `/api/scripts/generate` | WF 04 | ScriptFactoryService |
| Content Production | `/api/production/run` | WF 05 | ProductionService |
| Daily Engine | `/api/automation/trigger` | WF 01 | dailyContentEngine (inalterado no core) |

Daily Engine continua orquestrando o loop completo; Research/Script/Production existem como unidades isoladas.  
Production **não publica** — entrega pacote `READY_FOR_PUBLISH` para a Fase 4.
