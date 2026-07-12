# AGENTS.md

## Cursor Cloud specific instructions

This is a large monorepo. The primary product is the **JudgeTCG platform**: a FastAPI
backend (`services/api`) plus a Next.js 15 web app (`frontend/runtime_console_v3`), backed
by PostgreSQL + pgvector and Redis. See `README.md` and `SETUP_GUIDE.md` for full details;
only the non-obvious, Cloud-specific caveats are captured here.

### What the update script already does (do not repeat)
`python3 -m venv .venv` + install the API/ingestion Python deps into `.venv`, and `npm ci`
for the JS workspaces. Postgres 16 (+`pgvector`), Redis, and `python3.12-venv` are installed
at the system level and persist in the VM snapshot.

### Python: always use the venv
Backend deps live in `/workspace/.venv`, NOT system Python. Activate it first:
`source /workspace/.venv/bin/activate` (or call `/workspace/.venv/bin/<tool>` directly).

### Starting the local services (needed on every fresh boot)
Postgres and Redis do not auto-start. Start them before running the API:
- `sudo service redis-server start` (listens on the default port **6379**)
- `sudo pg_ctlcluster 16 main start`

DB role/database: `tcgjudge` / `tcgjudge_dev` / `tcg_judge` (superuser). The schema lives in
the `tcg_judge` Postgres schema and is seeded from `infra/db/*.sql` (14 TCG games). The
cluster data persists in the snapshot, so re-seeding is usually unnecessary. To re-seed:
`PGPASSWORD=tcgjudge_dev psql -h localhost -U tcgjudge -d tcg_judge -f infra/db/init.sql`
(then `02_*`…`06_*.sql`).

### Env files (already created; gitignored — recreate if missing)
- `services/api/.env` — copy of `.env.example` with `REDIS_URL=redis://localhost:6379/0`
  (the example defaults to 6380, which is the Docker-compose mapping — native Redis uses 6379).
- `frontend/runtime_console_v3/.env.local` — copy of `.env.example` with
  `API_PROXY_TARGET=http://127.0.0.1:8000` and `NEXT_PUBLIC_APP_URL=http://localhost:3000`.

### Running the apps (development)
- API: `cd services/api && uvicorn app.main:app --reload --port 8000`
  → health `http://127.0.0.1:8000/health` and `/v1/health`; games `GET /v1/games`; docs `/docs`.
- Web: `npm run dev --workspace=runtime-console-v3` (Next.js on port 3000). The browser talks
  to the API through Next BFF/proxy routes (`/api/proxy/*`, `/api/*`).

### Important scope caveats (what works vs. needs external services)
- The local stack fully supports the **Judge RAG core** (games, chunks, judge query). The Judge
  query endpoint (`POST /runtime/judge/query`, or the public proxy `/api/proxy/runtime/judge/query`)
  works anonymously in `development`.
- **Real RAG answers require `OPENAI_API_KEY` + an ingested corpus.** Without them the Judge
  responds gracefully with a "Configure OPENAI_API_KEY…" message and low confidence — this is
  expected, not a bug.
- **Authenticated UI flows are gated by Supabase** (login, `/judge` "Mesa de Regras", `/decks`,
  seller/store panels). Without `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` these pages show a login gate.
- **Marketplace / catalog / tournaments require the Supabase migrations** in `supabase/migrations/`
  (public schema, `auth.users`/`storage`/RLS). Those need a real Supabase project or
  `supabase start` (Docker). The lightweight `infra/db` schema does NOT include them, so the
  card catalog/marketplace pages render empty locally.

### Lint / test / build
- Frontend (from repo root): `npm run lint --workspace=runtime-console-v3` (passes; warnings only),
  `npm run type-check --workspace=runtime-console-v3`, `npm run test --workspace=runtime-console-v3`
  (Vitest, 387 tests pass), `npm run build --workspace=runtime-console-v3`.
- API: `ruff check app tests evaluation` and `pytest -q -m "not integration and not e2e and not smoke"`
  (run inside the venv, from `services/api`).
  - Known pre-existing failures on `main` (CI is red independent of this setup):
    - `pytest` full-suite collection aborts due to two `test_intelligence.py` files
      (`tests/analytics/` and `tests/catalog/`) lacking package `__init__.py`. Run scoped paths
      (e.g. `pytest tests/payments/…`) or a single file to execute tests successfully.
    - `ruff check` reports pre-existing lint errors.
