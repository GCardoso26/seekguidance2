CREATE TABLE IF NOT EXISTS manual_asset_requests (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  production_id TEXT NOT NULL,
  content_id TEXT,
  scene INTEGER NOT NULL,
  scene_description TEXT,
  visual_intent TEXT,
  search_queries TEXT NOT NULL DEFAULT '[]',
  recommended_provider TEXT NOT NULL DEFAULT 'pexels',
  required_format TEXT NOT NULL DEFAULT '9:16',
  required_orientation TEXT NOT NULL DEFAULT 'portrait',
  minimum_resolution TEXT NOT NULL DEFAULT '1080x1920',
  suggested_duration TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'AWAITING_USER',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_manual_asset_requests_prod
  ON manual_asset_requests (production_id, scene);
