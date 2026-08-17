-- Phase 5.1 PostgreSQL: Controlled production validation

ALTER TABLE contents ADD COLUMN IF NOT EXISTS approved_by TEXT;

CREATE TABLE IF NOT EXISTS production_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_id UUID,
  publication_id UUID,
  platform TEXT NOT NULL DEFAULT 'YOUTUBE_SHORT',
  data_origin TEXT NOT NULL DEFAULT 'REAL',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  experiment_status TEXT NOT NULL DEFAULT 'PLANNED',
  objective TEXT NOT NULL,
  hypothesis TEXT,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  content_dna JSONB NOT NULL DEFAULT '{}'::jsonb,
  dry_run_report JSONB,
  preflight_report JSONB,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  external_id TEXT,
  external_url TEXT,
  upload_outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_experiments_ws
  ON production_experiments(workspace_id, experiment_status);
