-- Phase 4: Publishing Engine + Analytics Feedback Loop

CREATE TABLE IF NOT EXISTS publication_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  production_run_id TEXT,
  package_id TEXT,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  scheduled_at TEXT,
  published_at TEXT,
  external_id TEXT,
  external_url TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  result TEXT NOT NULL DEFAULT '{}',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  execution_id TEXT,
  idempotency_key TEXT,
  publication_version INTEGER NOT NULL DEFAULT 1,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_publication_runs_idem ON publication_runs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_publication_runs_ws ON publication_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_publication_runs_content ON publication_runs(content_id, platform);

CREATE TABLE IF NOT EXISTS metric_snapshots (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  publication_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  captured_at TEXT NOT NULL DEFAULT (datetime('now')),
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  watch_time REAL NOT NULL DEFAULT 0,
  average_view_duration REAL NOT NULL DEFAULT 0,
  completion_rate REAL NOT NULL DEFAULT 0,
  followers_gained INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  raw_metrics TEXT NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'MOCK',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  snapshot_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (publication_id) REFERENCES publication_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_metric_snapshots_key ON metric_snapshots(snapshot_key);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_pub ON metric_snapshots(publication_id, captured_at DESC);

ALTER TABLE strategy_recommendations ADD COLUMN kind TEXT;
ALTER TABLE strategy_recommendations ADD COLUMN confidence REAL NOT NULL DEFAULT 0;
ALTER TABLE strategy_recommendations ADD COLUMN evidence_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE strategy_recommendations ADD COLUMN source_content_ids TEXT NOT NULL DEFAULT '[]';
ALTER TABLE strategy_recommendations ADD COLUMN status TEXT NOT NULL DEFAULT 'hypothesis';

ALTER TABLE content_metrics ADD COLUMN publication_id TEXT;
ALTER TABLE content_metrics ADD COLUMN platform TEXT;
ALTER TABLE content_metrics ADD COLUMN snapshot_id TEXT;
