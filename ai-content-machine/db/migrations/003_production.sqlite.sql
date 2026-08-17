-- Phase 3: Content Production Engine

CREATE TABLE IF NOT EXISTS production_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  content_id TEXT,
  script_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  current_stage TEXT,
  plan TEXT NOT NULL DEFAULT '{}',
  quality_score REAL,
  quality_breakdown TEXT NOT NULL DEFAULT '{}',
  package_status TEXT NOT NULL DEFAULT 'INCOMPLETE',
  retry_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  result TEXT NOT NULL DEFAULT '{}',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  execution_id TEXT,
  idempotency_key TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_production_runs_idem ON production_runs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_production_runs_ws ON production_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_runs_status ON production_runs(workspace_id, status, current_stage);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  content_id TEXT,
  production_id TEXT NOT NULL,
  type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  uri TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER NOT NULL DEFAULT 0,
  duration REAL,
  width INTEGER,
  height INTEGER,
  checksum TEXT NOT NULL,
  license TEXT NOT NULL DEFAULT 'MOCK',
  metadata TEXT NOT NULL DEFAULT '{}',
  parent_asset_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_current INTEGER NOT NULL DEFAULT 1,
  stage TEXT,
  asset_key TEXT NOT NULL DEFAULT 'main',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (production_id) REFERENCES production_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_media_assets_prod ON media_assets(production_id, type, is_current);
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_assets_key_ver ON media_assets(production_id, asset_key, version);
CREATE INDEX IF NOT EXISTS idx_media_assets_content ON media_assets(content_id, type);

CREATE TABLE IF NOT EXISTS content_packages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  content_id TEXT,
  production_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'INCOMPLETE',
  manifest TEXT NOT NULL DEFAULT '{}',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (production_id) REFERENCES production_runs(id) ON DELETE CASCADE
);

ALTER TABLE ai_cost_events ADD COLUMN production_run_id TEXT;
