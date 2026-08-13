-- Asset Library catalog (reuse across productions).
-- Distinct from media_assets (per-production versioned registry).

CREATE TABLE IF NOT EXISTS media_library_assets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  content_id TEXT,
  production_id TEXT,
  path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'audio', 'video')),
  source TEXT NOT NULL CHECK (source IN ('generated', 'stock', 'uploaded', 'mock')),
  tags TEXT NOT NULL DEFAULT '[]',
  usage_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mla_sha256 ON media_library_assets(sha256);
CREATE INDEX IF NOT EXISTS idx_mla_workspace_sha ON media_library_assets(workspace_id, sha256);
CREATE INDEX IF NOT EXISTS idx_mla_content_prod ON media_library_assets(content_id, production_id);
CREATE INDEX IF NOT EXISTS idx_mla_workspace_type ON media_library_assets(workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_mla_source_type ON media_library_assets(source, type);
