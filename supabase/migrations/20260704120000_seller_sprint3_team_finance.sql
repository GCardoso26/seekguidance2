-- Sprint 3: equipe RBAC, audit logs, notification settings
SET search_path TO tcg_judge, public;

CREATE TABLE IF NOT EXISTS store_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator'
    CHECK (role IN (
      'store_owner', 'manager', 'operator', 'stock_keeper',
      'support', 'finance', 'marketing'
    )),
  permissions JSONB DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  invited_email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_store_user_roles_store ON store_user_roles(store_id);
CREATE INDEX IF NOT EXISTS idx_store_user_roles_user ON store_user_roles(user_id);

CREATE TABLE IF NOT EXISTS store_user_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_user_logs_store ON store_user_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_store_user_logs_user ON store_user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_store_user_logs_created ON store_user_logs(created_at DESC);

ALTER TABLE stores ADD COLUMN IF NOT EXISTS notification_settings JSONB NOT NULL DEFAULT '{
  "new_order": ["email", "push"],
  "payment_received": ["email"],
  "ticket_created": ["email", "push"],
  "low_stock": ["email"],
  "daily_summary": ["email"]
}'::jsonb;

ALTER TABLE store_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_user_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE store_user_roles IS 'Membros da equipe da loja com role e permissões granulares';
COMMENT ON COLUMN store_user_roles.permissions IS 'Override JSONB; NULL usa defaults da role';
