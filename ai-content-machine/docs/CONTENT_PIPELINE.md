# Content Pipeline

```
Research → Script → Production → READY_FOR_PUBLISH
→ Publishing (MOCK) → Metrics → Winner → Strategy → Research
```

## Independência (Fase 2–4)

| Pipeline | Trigger API | n8n | Mock runner |
|----------|-------------|-----|-------------|
| Research | `/api/research/run` | WF 02 | ResearchService |
| Script Factory | `/api/scripts/generate` | WF 04 | ScriptFactoryService |
| Content Production | `/api/production/run` | WF 05 | ProductionService |
| Publishing | `/api/publishing/run` | WF 07 | PublishingService |
| Analytics | `/api/analytics/sync` | WF 08 | AnalyticsService |
| Winner | `/api/winners/detect` | WF 09 | WinnerDetectionService |
| Strategy | `/api/strategy/analyze` | WF 12 | StrategyService |
| Daily Engine | `/api/automation/trigger` | WF 01 | dailyContentEngine (inalterado no core) |

Feedback loop fecha o CWM: produzir → publicar → medir → aprender → pesquisar de novo.

### Fase 5 — YouTube controlado

Mocks permanecem. YouTube OAuth + publisher/analytics reais atrás de kill switch, dry-run, daily limit e `approvedForPublishing`.  
TikTok/Instagram/Pinterest: NOT_CONFIGURED. Ver `docs/YOUTUBE_CONTROLLED_PUBLISHING.md`.
