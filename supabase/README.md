# Supabase — schema e migrations

## Início rápido

```bash
# Instalar CLI: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref <PROJECT_REF>

# Aplicar migrations ao projeto remoto
supabase db push
```

## Migrations

- `migrations/20260519000000_init_tcg_judge.sql` — schema base (espelha `infra/db/init.sql`).

## Seed

Após schema, correr seed de jogos se existir em `infra/db/` ou re-aplicar dados do RDS via `pg_restore`.

## Ligação local (teste)

```bash
export DATABASE_URL="postgresql+asyncpg://..."
python scripts/ingest_tcg.py --game mtg --mtg-discover --mtg-only CR
```

Ver guia completo: [docs/SUPABASE_MIGRATION.md](../docs/SUPABASE_MIGRATION.md).
