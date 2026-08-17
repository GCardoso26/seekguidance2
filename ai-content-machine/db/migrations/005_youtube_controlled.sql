-- Phase 5 PostgreSQL

CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
  account_label TEXT,
  external_account_id TEXT,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  access_token_enc TEXT,
  refresh_token_enc TEXT,
  token_expires_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  reality TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_platform_connections_ws ON platform_connections(workspace_id, platform);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE publication_runs ADD COLUMN IF NOT EXISTS publication_source TEXT NOT NULL DEFAULT 'MOCK';
ALTER TABLE publication_runs ADD COLUMN IF NOT EXISTS upload_outcome TEXT;
ALTER TABLE publication_runs ADD COLUMN IF NOT EXISTS remote_status TEXT;
ALTER TABLE publication_runs ADD COLUMN IF NOT EXISTS dry_run BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS metrics_source TEXT NOT NULL DEFAULT 'MOCK';
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS window_label TEXT;

ALTER TABLE contents ADD COLUMN IF NOT EXISTS approved_for_publishing BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS approved_for_publishing_at TIMESTAMPTZ;

ALTER TABLE strategy_recommendations ADD COLUMN IF NOT EXISTS data_origin TEXT NOT NULL DEFAULT 'MOCK';
