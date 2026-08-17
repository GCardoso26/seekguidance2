# Fase 4 — Audit do existente

| Component | Existing | Complete | Reusable | Missing |
|-----------|----------|----------|----------|---------|
| mockPublish / mockAnalytics | ✓ Daily | mock only | extract | PublishingService |
| content_metrics | ✓ flat | yes | append | metric_snapshots |
| strategy_recommendations | ✓ schema | empty | ✓ | StrategyService writer |
| offers/leads/sales | ✓ schema | offers seeded | ✓ | real monetization later |
| domain_events / automation_* | ✓ | ✓ | ✓ | publication.* events |
| publication_runs | ✗ | — | — | **create** |
| metric_snapshots | ✗ | — | — | **create** |
| content_packages READY_FOR_PUBLISH | ✓ Fase 3 | ✓ | handoff | publisher consume |
| n8n 07–09, 12 | stub trigger | no | upgrade APIs | Control Plane |
| Winner/Strategy services | classify in mock | partial | extract | services |
| Real YT/TT/IG/Pin OAuth | ✗ | — | adapters stub | NOT_CONFIGURED |

**Decisão:** não duplicar `content_metrics`/`strategy_recommendations`. Criar `publication_runs` + `metric_snapshots`. Daily Engine intacto; Publishing Engine independente a partir de Content Package.
