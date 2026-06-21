# Judge TCG — Contexto v4 (pós Sprint 3)

**Gerado:** 2026-06-07  
**Repositório:** `S:\tcg-judge`

## Status

| Área | Estado |
|------|--------|
| Judge RAG (produção) | ✅ `judgetcg.com.br` |
| Plataforma torneios F1–5 | ✅ Backend ~100%, frontend ~90% |
| Sprint 0–2 | ✅ CI, rotas, E2E engine, deploy checklist |
| **Sprint 3 — Painel Juiz Digital** | ✅ Migration + API + UI + testes |

## Sprint 3 — entregas

### Database (`20260607000000_judge_system.sql`)

- `judge_certifications` — certificação por jogo/nível
- `judge_calls` — chamadas de mesa em torneios
- `call_infractions` — penalidades ligadas à chamada
- `fair_play_scores` — score 0–5 por jogador/jogo

### Backend

| Rota | Descrição |
|------|-----------|
| `POST /runtime/judge/judge/calls` | Jogador abre chamada |
| `GET /runtime/judge/judge/calls` | Lista (próprias / juiz / organizador) |
| `POST .../calls/{id}/accept` | Juiz aceita |
| `POST .../calls/{id}/resolve` | Juiz resolve + infração |
| `POST .../calls/{id}/escalate` | Escala para organizador |
| `GET .../certifications/me` | Certificações do juiz |

Auth: header `X-Judge-User-Id`.

### Frontend

- `/judge/dashboard` — abas Ativas / Abertas / Resolvidas + legacy reports
- BFF: `/api/judge/calls`, `/api/judge/certifications/me`
- Hooks: `useJudgeCalls`, `useJudgeCertification`, `useAcceptCall`, `useResolveCall`

### Testes

```bash
cd services/api
pytest tests/platform/test_judge_calls.py -v
pytest tests/platform/integration/test_judge_integration.py -v
pytest tests/platform/ -v -m "not e2e"

cd frontend/runtime_console_v3
npm run test && npm run build
```

## Coexistência com Judge Assistant (Fase A)

- **Fase A** (`judge_assistant` + `infraction_reports` in-memory/legacy): reports de partida
- **Sprint 3** (`judge_calls` + DB): chamadas em torneios multi-TCG com fair play

Dashboard unifica ambos na aba "Reports (legacy)".

## Próximos passos sugeridos

1. Seed de certificações de juiz (admin)
2. Botão "Chamar Juiz" no fluxo de mesa do torneio (jogador)
3. Realtime (Supabase) para novas chamadas
4. E2E HTTP com DB real (`@pytest.mark.integration` + `supabase db push`)

## Deploy

Ver `docs/DEPLOY_CHECKLIST.md` — incluir migration `20260607000000_judge_system.sql`.
