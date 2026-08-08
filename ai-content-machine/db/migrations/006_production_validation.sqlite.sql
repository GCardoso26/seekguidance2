-- Phase 5.1: Controlled production validation (experiments + approval actor)

ALTER TABLE contents ADD COLUMN approved_by TEXT;

CREATE TABLE IF NOT EXISTS production_experiments (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  content_id TEXT,
  publication_id TEXT,
  platform TEXT NOT NULL DEFAULT 'YOUTUBE_SHORT',
  data_origin TEXT NOT NULL DEFAULT 'REAL',
  started_at TEXT NOT NULL,
  published_at TEXT,
  experiment_status TEXT NOT NULL DEFAULT 'PLANNED',
  objective TEXT NOT NULL,
  hypothesis TEXT,
  result TEXT NOT NULL DEFAULT '{}',
  notes TEXT,
  content_dna TEXT NOT NULL DEFAULT '{}',
  dry_run_report TEXT,
  preflight_report TEXT,
  approved_at TEXT,
  approved_by TEXT,
  external_id TEXT,
  external_url TEXT,
  upload_outcome TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_production_experiments_ws
  ON production_experiments(workspace_id, experiment_status);
