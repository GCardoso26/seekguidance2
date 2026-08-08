-- Phase 3 PostgreSQL: Content Production Engine

CREATE TABLE IF NOT EXISTS production_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_id UUID,
  script_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  current_stage TEXT,
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  quality_score DOUBLE PRECISION,
  quality_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  package_status TEXT NOT NULL DEFAULT 'INCOMPLETE',
  retry_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  execution_id TEXT,
  idempotency_key TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_production_runs_idem ON production_runs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_production_runs_ws ON production_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_runs_status ON production_runs(workspace_id, status, current_stage);

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_id UUID,
  production_id UUID NOT NULL REFERENCES production_runs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  uri TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT NOT NULL DEFAULT 0,
  duration DOUBLE PRECISION,
  width INTEGER,
  height INTEGER,
  checksum TEXT NOT NULL,
  license TEXT NOT NULL DEFAULT 'MOCK',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  parent_asset_id UUID,
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  stage TEXT,
  asset_key TEXT NOT NULL DEFAULT 'main',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_prod ON media_assets(production_id, type, is_current);
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_assets_key_ver ON media_assets(production_id, asset_key, version);
CREATE INDEX IF NOT EXISTS idx_media_assets_content ON media_assets(content_id, type);

CREATE TABLE IF NOT EXISTS content_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_id UUID,
  production_id UUID NOT NULL UNIQUE REFERENCES production_runs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'INCOMPLETE',
  manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_cost_events ADD COLUMN IF NOT EXISTS production_run_id UUID;
