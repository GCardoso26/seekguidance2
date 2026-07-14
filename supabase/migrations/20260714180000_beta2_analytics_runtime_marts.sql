-- Beta 2 — Product Analytics Runtime mart snapshot store (additive only).
-- Does NOT alter existing domain / analytics_events tables.

SET search_path TO tcg_judge, public;

CREATE TABLE IF NOT EXISTS tcg_judge.analytics_runtime_mart_snapshots (
  mart_name TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  version INT NOT NULL DEFAULT 1,
  source_rows INT NOT NULL DEFAULT 0,
  duration_ms DOUBLE PRECISION,
  materialized_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_runtime_marts_updated
  ON tcg_judge.analytics_runtime_mart_snapshots (materialized_at DESC);

COMMENT ON TABLE tcg_judge.analytics_runtime_mart_snapshots IS
  'Beta 2 materialized Data Mart snapshots for Product Analytics Runtime. Dashboards read marts, never analytics_events.';
