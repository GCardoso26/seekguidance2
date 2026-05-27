# Scripts E2E

| Script | Descrição |
|--------|-----------|
| `validate-proxy-e2e.ps1` | Proxy Vercel → Render (health, login) |
| `validate-ingestion-catalog.ps1` | HEAD em todas as URLs do catálogo `tcg_official_sources.py` |
| `validate-judge-multi-tcg.ps1` | Judge não deve responder "em breve" para TCGs com RAG (requer API deployada) |

## Ordem recomendada após deploy

```powershell
pwsh scripts/e2e/validate-ingestion-catalog.ps1
# Aplicar migração Supabase + ingestão (--game fab --all, etc.)
pwsh scripts/e2e/validate-proxy-e2e.ps1
pwsh scripts/e2e/validate-judge-multi-tcg.ps1
```

Variável opcional: `$env:E2E_BASE = "http://127.0.0.1:8000"` para API local.
