-- Beta 1.5 — Event Integrity Platform
-- Additive: schema versioning columns + dead-letter queue. No business tables changed.

SET search_path TO tcg_judge, public;

ALTER TABLE tcg_judge.analytics_events
  ADD COLUMN IF NOT EXISTS event_schema_version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS ingest_trace_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'client';

CREATE UNIQUE INDEX IF NOT EXISTS uq_analytics_events_idempotency
  ON tcg_judge.analytics_events (event, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_schema_version
  ON tcg_judge.analytics_events (event, event_schema_version, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_ingest_trace
  ON tcg_judge.analytics_events (ingest_trace_id)
  WHERE ingest_trace_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS tcg_judge.analytics_events_dlq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reason TEXT NOT NULL,
  event_name TEXT,
  event_schema_version INT,
  payload JSONB NOT NULL,
  origin TEXT,
  ingest_trace_id TEXT,
  source_ip TEXT,
  user_agent TEXT,
  reprocess_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (reprocess_status IN ('pending', 'reprocessed', 'discarded', 'failed')),
  reprocessed_at TIMESTAMPTZ,
  error_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_dlq_pending
  ON tcg_judge.analytics_events_dlq (created_at DESC)
  WHERE reprocess_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_analytics_dlq_reason
  ON tcg_judge.analytics_events_dlq (reason, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_dlq_trace
  ON tcg_judge.analytics_events_dlq (ingest_trace_id)
  WHERE ingest_trace_id IS NOT NULL;

COMMENT ON TABLE tcg_judge.analytics_events_dlq IS
  'Dead-letter queue for analytics ingest: unknown, invalid schema/payload/version. Never silent-drop.';

COMMENT ON COLUMN tcg_judge.analytics_events.idempotency_key IS
  'Client/server key for critical events (purchase, checkout, listing_create, …)';

COMMENT ON COLUMN tcg_judge.analytics_events.event_schema_version IS
  'Payload schema version (v1 default). See docs/product/EVENT_VERSIONING.md';
