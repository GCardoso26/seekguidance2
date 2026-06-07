# Judge TCG — Contexto v3 (pós Sprint 2)

**Gerado:** 2026-06-06  
**Repositório:** `S:\tcg-judge`

## Status

| Área | Estado |
|------|--------|
| Judge RAG (produção) | ✅ `judgetcg.com.br` |
| Plataforma torneios F1–5 | ✅ Backend ~100%, frontend ~90% |
| Sprint 0 | ✅ CI desbloqueado (`require_api_key`, vitest 109/109) |
| Sprint 1 | ✅ 6 rotas frontend + BFF |
| Sprint 2 | ✅ `tests/platform/`, E2E engine, deploy checklist |
| Fase 6 | 📋 **Painel Juiz Digital** priorizado |

## Testes

```bash
cd services/api
pytest tests/platform/ -v -m "not e2e"    # CI (~30 testes)
pytest tests/platform/e2e/ -v -m e2e      # E2E lento

cd frontend/runtime_console_v3
npm run test   # 109 vitest
npm run build
```

## Rotas frontend (torneios)

- `/player/me`, `/stores`, `/stores/create`
- `/marketplace/[id]`, `/social/friends`, `/social/communities`

## Auth API torneios

Header: `X-Judge-User-Id` (não Bearer). BFF usa `tournamentProxyHeaders()` + Supabase.

## Próximo: Sprint 3 — Painel Juiz Digital

- Completar UI `/judge/dashboard` + fluxo de infrações
- Integrar `judge-panel/` com API `judge_assistant`
- E2E HTTP torneio com DB real (`@pytest.mark.integration`)

## Deploy

Ver `docs/DEPLOY_CHECKLIST.md`
