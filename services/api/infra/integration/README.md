# Sprint 4.4 — Integration stack helpers
#
# Start infrastructure (Postgres + Redis + Meilisearch):
#   docker compose -f docker-compose.yml up -d
#
# Apply domain migrations (from services/api):
#   DATABASE_URL=postgres://judgetcg:judgetcg@localhost:5433/judgetcg \
#     npx tsx scripts/applyFoundationMigrations.ts migrate
#
# Run production-like workers (separate terminals):
#   DATABASE_URL=... REDIS_URL=redis://localhost:6380 \
#     npm run worker:outbox
#   DATABASE_URL=... REDIS_URL=redis://localhost:6380 \
#     MEILI_HOST=http://localhost:7701 MEILI_API_KEY=masterKey \
#     npm run worker:search
#   JWT_SECRET=... npm run api:auth
#
# Smoke:
#   npm run smoke:golden-path
#   SMOKE_ONCE=1 npm run smoke:periodic
