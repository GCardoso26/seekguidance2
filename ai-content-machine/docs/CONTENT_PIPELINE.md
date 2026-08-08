# Content Pipeline

```
Research Engine → Topics → Ideas → Script Factory → Scripts
→ (next) Production → QA → Approval → Publish → Analytics
→ Winner → Recycling → Monetize
```

## Independência (Fase 2)

| Pipeline | Trigger API | n8n | Mock runner |
|----------|-------------|-----|-------------|
| Research | `/api/research/run` | WF 02 | ResearchService |
| Script Factory | `/api/scripts/generate` | WF 04 | ScriptFactoryService |
| Daily Engine | `/api/automation/trigger` | WF 01 | dailyContentEngine (inalterado no core) |

Daily Engine continua orquestrando o loop completo; Research/Script agora também existem como unidades isoladas.
