# Arquitetura Judge TCG

## Camadas

- **Frontend** (`frontend/runtime_console_v3`): Next.js 15, BFF proxies em `src/app/api/*`
- **API** (`services/api`): FastAPI, prefixo `/runtime/judge/*`
- **Database**: Supabase Postgres, schema `tcg_judge`
- **Cache/Timer**: Redis
- **Worker**: `worker_main.py` — jobs agendados (ranking decay)

## Módulos principais

| Módulo | Responsabilidade |
|--------|------------------|
| `tcg_adapters/` | Multi-TCG parsers e validação |
| `tournament/` | Engine Swiss, timer, fluxo operacional |
| `players/` | Perfis, rankings, achievements |
| `notifications/` | In-app, Web Push, email/SMS stubs |
| `payments/` | Inscrições Stripe |
| `leagues/` | Temporadas e standings |
| `social/` | Amigos, mensagens, comunidades |
| `admin/` | Moderação e analytics da plataforma |

## Auth

Header `X-Judge-User-Id` (Supabase user id) + `judge_profiles.role` para RBAC admin.
