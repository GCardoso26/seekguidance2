-- Visual quality gate metadata for Asset Library reuse.

ALTER TABLE media_library_assets ADD COLUMN quality_status TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE media_library_assets ADD COLUMN quality_score REAL NOT NULL DEFAULT 0;
ALTER TABLE media_library_assets ADD COLUMN quality_findings TEXT NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_mla_quality ON media_library_assets(workspace_id, type, quality_status, quality_score);

-- Legacy mock bars must never be reused.
UPDATE media_library_assets
SET quality_status = 'REJECTED', quality_score = 0.2, quality_findings = '["legacy_mock"]'
WHERE source = 'mock';

-- Pre-PR generated/stock/uploaded frames stay PENDING until re-QA'd with the new
-- Visual Director prompts. Never auto-APPROVE "Dark content scene…" era assets.
UPDATE media_library_assets
SET quality_status = 'PENDING', quality_score = 0, quality_findings = '["legacy_pending_requalify"]'
WHERE source IN ('generated', 'stock', 'uploaded');
