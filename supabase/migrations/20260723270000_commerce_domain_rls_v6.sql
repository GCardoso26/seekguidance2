-- V6 stabilization: RLS deny-by-default on commerce domain schemas (BUG-V5-008)
-- Server-side API uses privileged DATABASE_URL; anon/authenticated must not read via Data API.

REVOKE USAGE ON SCHEMA marketplace FROM PUBLIC, anon, authenticated;
REVOKE USAGE ON SCHEMA payment FROM PUBLIC, anon, authenticated;
REVOKE USAGE ON SCHEMA cart FROM PUBLIC, anon, authenticated;
REVOKE USAGE ON SCHEMA reservation FROM PUBLIC, anon, authenticated;
REVOKE USAGE ON SCHEMA identity FROM PUBLIC, anon, authenticated;
REVOKE USAGE ON SCHEMA platform FROM PUBLIC, anon, authenticated;
REVOKE USAGE ON SCHEMA "order" FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname IN ('marketplace', 'payment', 'cart', 'reservation', 'identity', 'platform', 'order')
      AND c.relkind = 'r'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
      r.schema_name,
      r.table_name
    );
  END LOOP;
END $$;
