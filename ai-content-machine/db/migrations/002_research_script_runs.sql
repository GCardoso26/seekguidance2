-- Phase 2 PostgreSQL

ALTER TABLE topics ADD COLUMN IF NOT EXISTS fingerprint TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS score INT NOT NULL DEFAULT 0;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS score_breakdown JSONB NOT NULL DEFAULT '{}';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS normalized_title TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_fingerprint ON topics(fingerprint);

ALTER TABLE scripts ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS quality_score NUMERIC;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS quality_breakdown JSONB NOT NULL DEFAULT '{}';
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS script_run_id UUID;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS selected_hooks JSONB NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS research_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  niche_id UUID,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  provider TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  items_found INT NOT NULL DEFAULT 0,
  topics_created INT NOT NULL DEFAULT 0,
  error TEXT,
  result JSONB NOT NULL DEFAULT '{}',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  execution_id TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS script_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_idea_id UUID NOT NULL REFERENCES content_ideas(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  model TEXT,
  provider TEXT,
  tokens_input INT NOT NULL DEFAULT 0,
  tokens_output INT NOT NULL DEFAULT 0,
  estimated_cost_cents INT NOT NULL DEFAULT 0,
  error TEXT,
  result JSONB NOT NULL DEFAULT '{}',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  execution_id TEXT,
  idempotency_key TEXT UNIQUE,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_cost_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  estimated_cost_cents INT NOT NULL DEFAULT 0,
  content_idea_id UUID,
  script_run_id UUID,
  research_run_id UUID,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
