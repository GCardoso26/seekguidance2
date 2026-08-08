-- Content War Machine — PostgreSQL canonical schema
-- Database/schema: content_war (separate from n8n internals)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID REFERENCES users(id),
  brand_voice JSONB NOT NULL DEFAULT '{}',
  automation_mode TEXT NOT NULL DEFAULT 'mock' CHECK (automation_mode IN ('mock','production')),
  approval_mode TEXT NOT NULL DEFAULT 'SEMI_AUTO' CHECK (approval_mode IN ('MANUAL','SEMI_AUTO','FULL_AUTO')),
  publishing_mode TEXT NOT NULL DEFAULT 'AUTO' CHECK (publishing_mode IN ('AUTO','MANUAL')),
  daily_content_qty INT NOT NULL DEFAULT 5,
  ai_budget_cents_per_day INT NOT NULL DEFAULT 2000,
  research_frequency TEXT NOT NULL DEFAULT 'daily',
  analytics_frequency TEXT NOT NULL DEFAULT '6h',
  concurrency_limits JSONB NOT NULL DEFAULT '{"maxAiJobs":3,"maxPublishPerChannel":1,"maxResearchPerMinute":10}',
  paused BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube','tiktok','instagram','pinterest')),
  face TEXT NOT NULL CHECK (face IN ('A','B','C')),
  credentials_ref TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  promise TEXT,
  keywords JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  niche_id UUID REFERENCES niches(id),
  title TEXT NOT NULL,
  source_trace JSONB NOT NULL DEFAULT '[]',
  opportunity_score NUMERIC NOT NULL DEFAULT 0,
  trend_score NUMERIC NOT NULL DEFAULT 0,
  gap_score NUMERIC NOT NULL DEFAULT 0,
  reality TEXT NOT NULL DEFAULT 'MOCK' CHECK (reality IN ('REAL','MOCK','SIMULATED','FAILED','PENDING')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id),
  title TEXT NOT NULL,
  hooks JSONB NOT NULL DEFAULT '[]',
  angles JSONB NOT NULL DEFAULT '[]',
  formats JSONB NOT NULL DEFAULT '[]',
  opportunity_score NUMERIC NOT NULL DEFAULT 0,
  parent_content_id UUID,
  derivation_type TEXT,
  new_angle TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES content_ideas(id) ON DELETE CASCADE,
  hook TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}',
  cta TEXT NOT NULL,
  caption TEXT,
  hashtags JSONB NOT NULL DEFAULT '[]',
  visual_brief JSONB NOT NULL DEFAULT '{}',
  qa_status TEXT NOT NULL DEFAULT 'pending',
  qa_notes JSONB NOT NULL DEFAULT '[]',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES content_ideas(id),
  script_id UUID REFERENCES scripts(id),
  channel_id UUID REFERENCES channels(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','queued_production','in_production','qa','pending_approval','approved','scheduled','publishing','published','failed','rejected')),
  approval_required BOOLEAN NOT NULL DEFAULT true,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform_post_id TEXT,
  asset_meta JSONB NOT NULL DEFAULT '{}',
  safety_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (safety_status IN ('pending','pass','requires_review','fail')),
  safety_notes JSONB NOT NULL DEFAULT '[]',
  performance_class TEXT CHECK (performance_class IN ('WINNER','PROMISING','NORMAL','LOSER')),
  performance_score NUMERIC,
  parent_content_id UUID REFERENCES contents(id),
  offer_id UUID,
  cost_cents INT NOT NULL DEFAULT 0,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  views INT NOT NULL DEFAULT 0,
  likes INT NOT NULL DEFAULT 0,
  comments INT NOT NULL DEFAULT 0,
  shares INT NOT NULL DEFAULT 0,
  saves INT NOT NULL DEFAULT 0,
  watch_time_sec NUMERIC NOT NULL DEFAULT 0,
  retention_pct NUMERIC NOT NULL DEFAULT 0,
  ctr NUMERIC NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  followers_gained INT NOT NULL DEFAULT 0,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INT NOT NULL,
  type TEXT NOT NULL,
  landing_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  source_content_id UUID REFERENCES contents(id),
  offer_id UUID REFERENCES offers(id),
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  offer_id UUID REFERENCES offers(id),
  source_content_id UUID REFERENCES contents(id),
  campaign_id UUID,
  amount_cents INT NOT NULL,
  commission_cents INT NOT NULL DEFAULT 0,
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version INT NOT NULL,
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, version)
);

CREATE TABLE IF NOT EXISTS domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  workflow TEXT NOT NULL,
  execution_id TEXT,
  entity_type TEXT,
  entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'processed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workflow TEXT NOT NULL,
  execution_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','completed','failed','cancelled','dead_letter')),
  reality TEXT NOT NULL DEFAULT 'MOCK',
  items_input INT NOT NULL DEFAULT 0,
  items_output INT NOT NULL DEFAULT 0,
  tokens INT NOT NULL DEFAULT 0,
  cost_cents INT NOT NULL DEFAULT 0,
  error TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow TEXT NOT NULL,
  execution_id TEXT,
  entity_type TEXT,
  entity_id TEXT,
  error TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  attempts INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS war_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  day INT NOT NULL DEFAULT 1,
  goal_revenue_cents INT NOT NULL DEFAULT 1000000,
  revenue_cents INT NOT NULL DEFAULT 0,
  posts INT NOT NULL DEFAULT 0,
  views INT NOT NULL DEFAULT 0,
  leads INT NOT NULL DEFAULT 0,
  sales INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS strategy_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  window_days INT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  reality TEXT NOT NULL DEFAULT 'MOCK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contents_workspace_status ON contents(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_runs_workspace ON automation_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_events_type ON domain_events(event_type, created_at DESC);
