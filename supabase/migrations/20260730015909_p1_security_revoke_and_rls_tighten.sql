-- P1 AUDIT-006 / AUDIT-007 — security harden (evidence: Supabase advisors WARN)
-- handle_new_user_google_confirm: trigger-only; must not be RPC-callable by anon.
-- rls_auto_enable: event-trigger-only; must not be RPC-callable by anon.
-- analytics_events / newsletter_subscribers: inserts vão pela API (service_role);
--   policies WITH CHECK (true) para anon/public permitem spam via PostgREST.

-- AUDIT-006 -----------------------------------------------------------------
REVOKE ALL ON FUNCTION public.handle_new_user_google_confirm() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user_google_confirm() FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;

-- AUDIT-007 -----------------------------------------------------------------
DROP POLICY IF EXISTS analytics_events_insert_anon ON tcg_judge.analytics_events;
DROP POLICY IF EXISTS "Newsletter public subscribe" ON tcg_judge.newsletter_subscribers;

-- Deny-by-default via RLS (service_role bypasses). Select policy existente
-- analytics_events_select_service permanece (USING false para authenticated).
