# QA Warehouse (`testing/history/`)

Cada execução do **QA Orchestrator** arquiva uma campanha **imutável**:

- `campaign-001.json`, `campaign-002.json`, …
- Índice resumido: `index.json`

Nada sobrescreve arquivos já gravados. O próximo número vem de `nextCampaignNumber`.

## Campos típicos

| Campo | Descrição |
| --- | --- |
| `counts.p0/p1/p2` | Achados **novos** (KB deduplicada) |
| `counts.seenAgain` | Reincidências de bugs conhecidos |
| `durationMinutes` | Duração da campanha |
| `environment` | LOCAL / STAGING / CI |
| `stack` | PASS / WARN / FAIL (audit + smoke) |
| `releaseReadiness` | Resumo executivo de engenharia |
| `confidence` | PASS/WARN + % por persona |
| `featureCoverage` | FCS por funcionalidade |

Tendências regeneráveis: `npm run test:qa:trends` → `testing/reports/quality-trends.md`.

Bug Knowledge Base: `testing/knowledge/bugs.json` — ver [QA_OPERATIONAL_MEMORY.md](../../docs/testing/QA_OPERATIONAL_MEMORY.md).
