-- Phase 5: YouTube controlled publishing + connections

CREATE TABLE IF NOT EXISTS platform_connections (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
  account_label TEXT,
  external_account_id TEXT,
  scopes TEXT NOT NULL DEFAULT '[]',
  access_token_enc TEXT,
  refresh_token_enc TEXT,
  token_expires_at TEXT,
  last_verified_at TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  reality TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  UNIQUE(workspace_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_platform_connections_ws ON platform_connections(workspace_id, platform);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

ALTER TABLE publication_runs ADD COLUMN publication_source TEXT NOT NULL DEFAULT 'MOCK';
ALTER TABLE publication_runs ADD COLUMN upload_outcome TEXT;
ALTER TABLE publication_runs ADD COLUMN remote_status TEXT;
ALTER TABLE publication_runs ADD COLUMN dry_run INTEGER NOT NULL DEFAULT 0;

ALTER TABLE metric_snapshots ADD COLUMN metrics_source TEXT NOT NULL DEFAULT 'MOCK';
ALTER TABLE metric_snapshots ADD COLUMN window_label TEXT;

ALTER TABLE contents ADD COLUMN approved_for_publishing INTEGER NOT NULL DEFAULT 0;
ALTER TABLE contents ADD COLUMN approved_for_publishing_at TEXT;

ALTER TABLE strategy_recommendations ADD COLUMN data_origin TEXT NOT NULL DEFAULT 'MOCK';
