-- P3 / BUG-V4-010: RLS deny-by-default on product_catalog
-- Catalog is server-side only (API via DATABASE_URL). No PostgREST client policies.
-- Enabling RLS with zero policies blocks anon/authenticated even if grants are added later.

BEGIN;

-- Hardening: never expose schema to Data API client roles
REVOKE USAGE ON SCHEMA product_catalog FROM PUBLIC;
REVOKE USAGE ON SCHEMA product_catalog FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA product_catalog FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA product_catalog FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA product_catalog FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA product_catalog FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA product_catalog
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA product_catalog
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;

-- Enable RLS on every base table (idempotent)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'product_catalog'
      AND c.relkind = 'r'
  LOOP
    EXECUTE format(
      'ALTER TABLE product_catalog.%I ENABLE ROW LEVEL SECURITY',
      r.table_name
    );
  END LOOP;
END $$;

COMMIT;
