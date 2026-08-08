-- SQLite adaptation for local/mock (PostgreSQL remains canonical)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_user_id TEXT,
  brand_voice TEXT NOT NULL DEFAULT '{}',
  automation_mode TEXT NOT NULL DEFAULT 'mock',
  approval_mode TEXT NOT NULL DEFAULT 'SEMI_AUTO',
  publishing_mode TEXT NOT NULL DEFAULT 'AUTO',
  daily_content_qty INTEGER NOT NULL DEFAULT 5,
  ai_budget_cents_per_day INTEGER NOT NULL DEFAULT 2000,
  research_frequency TEXT NOT NULL DEFAULT 'daily',
  analytics_frequency TEXT NOT NULL DEFAULT '6h',
  concurrency_limits TEXT NOT NULL DEFAULT '{"maxAiJobs":3,"maxPublishPerChannel":1,"maxResearchPerMinute":10}',
  paused INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  face TEXT NOT NULL,
  credentials_ref TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS niches (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  promise TEXT,
  keywords TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  niche_id TEXT,
  title TEXT NOT NULL,
  source_trace TEXT NOT NULL DEFAULT '[]',
  opportunity_score REAL NOT NULL DEFAULT 0,
  trend_score REAL NOT NULL DEFAULT 0,
  gap_score REAL NOT NULL DEFAULT 0,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_ideas (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  topic_id TEXT,
  title TEXT NOT NULL,
  hooks TEXT NOT NULL DEFAULT '[]',
  angles TEXT NOT NULL DEFAULT '[]',
  formats TEXT NOT NULL DEFAULT '[]',
  opportunity_score REAL NOT NULL DEFAULT 0,
  parent_content_id TEXT,
  derivation_type TEXT,
  new_angle TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scripts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  idea_id TEXT NOT NULL,
  hook TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '{}',
  cta TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT NOT NULL DEFAULT '[]',
  visual_brief TEXT NOT NULL DEFAULT '{}',
  qa_status TEXT NOT NULL DEFAULT 'pending',
  qa_notes TEXT NOT NULL DEFAULT '[]',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (idea_id) REFERENCES content_ideas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  idea_id TEXT,
  script_id TEXT,
  channel_id TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  approval_required INTEGER NOT NULL DEFAULT 1,
  scheduled_at TEXT,
  published_at TEXT,
  platform_post_id TEXT,
  asset_meta TEXT NOT NULL DEFAULT '{}',
  safety_status TEXT NOT NULL DEFAULT 'pending',
  safety_notes TEXT NOT NULL DEFAULT '[]',
  performance_class TEXT,
  performance_score REAL,
  parent_content_id TEXT,
  offer_id TEXT,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_metrics (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  watch_time_sec REAL NOT NULL DEFAULT 0,
  retention_pct REAL NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  followers_gained INTEGER NOT NULL DEFAULT 0,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  type TEXT NOT NULL,
  landing_url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  source_content_id TEXT,
  offer_id TEXT,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  lead_id TEXT,
  offer_id TEXT,
  source_content_id TEXT,
  campaign_id TEXT,
  amount_cents INTEGER NOT NULL,
  commission_cents INTEGER NOT NULL DEFAULT 0,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL,
  body TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(name, version)
);

CREATE TABLE IF NOT EXISTS domain_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  payload TEXT NOT NULL DEFAULT '{}',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS automation_events (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  workflow TEXT NOT NULL,
  execution_id TEXT,
  entity_type TEXT,
  entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'processed',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS automation_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  workflow TEXT NOT NULL,
  execution_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  items_input INTEGER NOT NULL DEFAULT 0,
  items_output INTEGER NOT NULL DEFAULT 0,
  tokens INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  payload TEXT NOT NULL DEFAULT '{}',
  result TEXT NOT NULL DEFAULT '{}',
  started_at TEXT,
  finished_at TEXT,
  duration_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS automation_failures (
  id TEXT PRIMARY KEY,
  workflow TEXT NOT NULL,
  execution_id TEXT,
  entity_type TEXT,
  entity_id TEXT,
  error TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS war_campaigns (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  day INTEGER NOT NULL DEFAULT 1,
  goal_revenue_cents INTEGER NOT NULL DEFAULT 1000000,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  posts INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  sales INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS strategy_recommendations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  window_days INTEGER NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contents_workspace_status ON contents(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_runs_workspace ON automation_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_events_type ON domain_events(event_type, created_at DESC);
