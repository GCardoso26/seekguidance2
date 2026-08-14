-- Visual quality gate metadata for Asset Library reuse.

ALTER TABLE media_library_assets ADD COLUMN IF NOT EXISTS quality_status TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE media_library_assets ADD COLUMN IF NOT EXISTS quality_score DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE media_library_assets ADD COLUMN IF NOT EXISTS quality_findings JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_mla_quality ON media_library_assets(workspace_id, type, quality_status, quality_score);

UPDATE media_library_assets
SET quality_status = 'REJECTED', quality_score = 0.2, quality_findings = '["legacy_mock"]'::jsonb
WHERE source = 'mock';

UPDATE media_library_assets
SET quality_status = 'PENDING', quality_score = 0, quality_findings = '["legacy_pending_requalify"]'::jsonb
WHERE source IN ('generated', 'stock', 'uploaded');
