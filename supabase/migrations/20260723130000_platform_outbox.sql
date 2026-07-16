-- Outbox + consumer offsets (platform) — incremento pós v0.2.0-foundation
-- Leasing, DLQ (dead), correlation/causation no payload do envelope.

BEGIN;

CREATE SCHEMA IF NOT EXISTS platform;

CREATE TABLE IF NOT EXISTS platform.outbox_events (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type     text NOT NULL,
  aggregate_id       text NOT NULL,
  event_name         text NOT NULL,
  event_version      int  NOT NULL DEFAULT 1,
  schema_version     int  NOT NULL DEFAULT 1,
  payload            jsonb NOT NULL,
  status             text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'leased', 'published', 'dead')),
  attempts           int  NOT NULL DEFAULT 0,
  max_attempts       int  NOT NULL DEFAULT 5,
  next_retry_at      timestamptz,
  lease_until        timestamptz,
  leased_by          text,
  published_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  request_id         text,
  trace_id           text,
  correlation_id     text NOT NULL,
  causation_id       text,
  projection_version text,
  last_error         text
);

CREATE INDEX IF NOT EXISTS idx_outbox_claim
  ON platform.outbox_events (status, next_retry_at, created_at)
  WHERE status IN ('pending', 'leased');

CREATE INDEX IF NOT EXISTS idx_outbox_dead
  ON platform.outbox_events (created_at DESC)
  WHERE status = 'dead';

CREATE INDEX IF NOT EXISTS idx_outbox_correlation
  ON platform.outbox_events (correlation_id);

CREATE TABLE IF NOT EXISTS platform.consumer_offsets (
  consumer_name          text NOT NULL,
  event_id               uuid NOT NULL REFERENCES platform.outbox_events(id),
  processed_at           timestamptz NOT NULL DEFAULT now(),
  processing_duration_ms int,
  result                 text NOT NULL
    CHECK (result IN ('success', 'skipped', 'failed')),
  last_error             text,
  PRIMARY KEY (consumer_name, event_id)
);

CREATE INDEX IF NOT EXISTS idx_consumer_offsets_processed
  ON platform.consumer_offsets (processed_at DESC);

COMMENT ON TABLE platform.outbox_events IS
  'Transactional outbox — payload immutable after insert; lease + dead DLQ';
COMMENT ON COLUMN platform.outbox_events.payload IS
  'Exact DomainEvent envelope snapshot; never UPDATE after insert';

COMMIT;
