-- Phase 2: research_runs, script_runs, topic fingerprints, AI cost

ALTER TABLE topics ADD COLUMN fingerprint TEXT;
ALTER TABLE topics ADD COLUMN score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE topics ADD COLUMN score_breakdown TEXT NOT NULL DEFAULT '{}';
ALTER TABLE topics ADD COLUMN normalized_title TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_fingerprint ON topics(fingerprint);

ALTER TABLE scripts ADD COLUMN platform TEXT;
ALTER TABLE scripts ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE scripts ADD COLUMN quality_score REAL;
ALTER TABLE scripts ADD COLUMN quality_breakdown TEXT NOT NULL DEFAULT '{}';
ALTER TABLE scripts ADD COLUMN script_run_id TEXT;
ALTER TABLE scripts ADD COLUMN selected_hooks TEXT NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS research_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  niche_id TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  provider TEXT,
  started_at TEXT,
  completed_at TEXT,
  items_found INTEGER NOT NULL DEFAULT 0,
  topics_created INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  result TEXT NOT NULL DEFAULT '{}',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  execution_id TEXT,
  idempotency_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_runs_idem ON research_runs(idempotency_key);

CREATE TABLE IF NOT EXISTS script_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  content_idea_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  started_at TEXT,
  completed_at TEXT,
  model TEXT,
  provider TEXT,
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  result TEXT NOT NULL DEFAULT '{}',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  execution_id TEXT,
  idempotency_key TEXT,
  platform TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (content_idea_id) REFERENCES content_ideas(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_script_runs_idem ON script_runs(idempotency_key);

CREATE TABLE IF NOT EXISTS ai_cost_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  content_idea_id TEXT,
  script_run_id TEXT,
  research_run_id TEXT,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_research_runs_ws ON research_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_script_runs_ws ON script_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_ws ON ai_cost_events(workspace_id, created_at DESC);
