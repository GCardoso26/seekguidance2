-- Phase 4 PostgreSQL: Publishing + Analytics Feedback Loop

CREATE TABLE IF NOT EXISTS publication_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  production_run_id UUID,
  package_id UUID,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  external_id TEXT,
  external_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  execution_id TEXT,
  idempotency_key TEXT,
  publication_version INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_publication_runs_idem ON publication_runs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_publication_runs_ws ON publication_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_publication_runs_content ON publication_runs(content_id, platform);

CREATE TABLE IF NOT EXISTS metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  publication_id UUID NOT NULL REFERENCES publication_runs(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  watch_time DOUBLE PRECISION NOT NULL DEFAULT 0,
  average_view_duration DOUBLE PRECISION NOT NULL DEFAULT 0,
  completion_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  followers_gained INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  raw_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'MOCK',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  snapshot_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_metric_snapshots_key ON metric_snapshots(snapshot_key);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_pub ON metric_snapshots(publication_id, captured_at DESC);

ALTER TABLE strategy_recommendations ADD COLUMN IF NOT EXISTS kind TEXT;
ALTER TABLE strategy_recommendations ADD COLUMN IF NOT EXISTS confidence DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE strategy_recommendations ADD COLUMN IF NOT EXISTS evidence_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE strategy_recommendations ADD COLUMN IF NOT EXISTS source_content_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE strategy_recommendations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'hypothesis';

ALTER TABLE content_metrics ADD COLUMN IF NOT EXISTS publication_id UUID;
ALTER TABLE content_metrics ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE content_metrics ADD COLUMN IF NOT EXISTS snapshot_id UUID;
