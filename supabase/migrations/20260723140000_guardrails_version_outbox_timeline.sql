-- Guard rails pré-processors: optimistic locking + outbox timeline
BEGIN;

-- ---------------------------------------------------------------------------
-- Aggregate row_version (optimistic concurrency)
-- ---------------------------------------------------------------------------
ALTER TABLE catalog.catalog_games
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1;

ALTER TABLE catalog.catalog_sets
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1;

ALTER TABLE catalog.catalog_cards
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1;

ALTER TABLE catalog.catalog_variants
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1;

ALTER TABLE catalog.provider_mappings
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1;

COMMENT ON COLUMN catalog.catalog_cards.row_version IS
  'Optimistic concurrency — increment on every successful update';

-- ---------------------------------------------------------------------------
-- Outbox timeline: four distinct moments
--   occurredAt   → DomainEvent.metadata.occurredAt (inside payload)
--   committedAt  → this column (TX commit / outbox insert)
--   publishedAt  → published_at (publisher)
--   processedAt  → consumer_offsets.processed_at
-- ---------------------------------------------------------------------------
ALTER TABLE platform.outbox_events
  ADD COLUMN IF NOT EXISTS committed_at timestamptz;

UPDATE platform.outbox_events
SET committed_at = created_at
WHERE committed_at IS NULL;

ALTER TABLE platform.outbox_events
  ALTER COLUMN committed_at SET DEFAULT now();

ALTER TABLE platform.outbox_events
  ALTER COLUMN committed_at SET NOT NULL;

COMMENT ON COLUMN platform.outbox_events.committed_at IS
  'When the producing TX committed (outbox insert). Differs from payload.occurredAt.';
COMMENT ON COLUMN platform.outbox_events.published_at IS
  'When EventPublisher successfully published.';
COMMENT ON COLUMN platform.outbox_events.created_at IS
  'Row insert time; typically equals committed_at.';

COMMIT;
