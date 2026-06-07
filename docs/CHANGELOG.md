# Changelog — Judge TCG

Formato baseado em [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Sprint Final: docs `SECURITY.md`, `RUNBOOK.md`, `CHANGELOG.md`, contexto v5
- Migration `20260607120000_production_performance.sql` (índices + `leaderboard_cache`)
- Sentry opcional (API + frontend via `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`)
- Pool DB configurável em produção (`app/config/production.py`)
- CI job Vitest para `frontend/runtime_console_v3`
- Campo `infracting_player_id` no modal de resolver chamada de juiz

### Fixed
- Conflito `messages` vs `social_messages` na migration social (db push)
- Penalidades no painel juiz exigiam `infracting_player_id` sem UI

## [2026-06-07] — Sprint 3

- Painel Juiz Digital: `judge_calls`, certificações, fair play
- API `/runtime/judge/judge/*` + dashboard `/judge/dashboard`

## [2026-06-06] — Sprint 2

- Torneios multi-TCG, marketplace, streaming API
- Checklist de deploy inicial

## [2026-06-05] — Sprint 0–1

- Judge RAG em produção
- Plataforma torneios Fase A/B
- CI Ruff + pytest platform
