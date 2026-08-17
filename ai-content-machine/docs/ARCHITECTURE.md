# Architecture — Content War Machine

Ver também: `N8N_ARCHITECTURE.md`, `PHASE2_AUDIT.md`.

```
Control Plane (web + api)
        │
        ▼
   PostgreSQL / SQLite
        ▲
Orchestration (n8n | LocalOrchestrator)
```

Fase 2 adiciona runners de domínio:

- `ResearchService`
- `ScriptFactoryService`

ambos acionáveis por API, AutomationService e workflows n8n, sem segundo event bus / AI Router.
