-- Sprint 5: Fulfillment Context — aggregate, shipments, jobs, outbox, projection
SET search_path TO tcg_judge, public;

-- Official Fulfillment state machine (fulfillment.md)
CREATE TABLE IF NOT EXISTS fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES shop_orders(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN (
      'Pending', 'Picking', 'Picked', 'Packing', 'Packed', 'ReadyToShip',
      'Shipped', 'InTransit', 'Delivered', 'Completed',
      'Delayed', 'Lost', 'Returned', 'Cancelled', 'Exception', 'Failed'
    )),
  model TEXT NOT NULL DEFAULT 'seller_fulfillment'
    CHECK (model IN ('seller_fulfillment', 'marketplace_fulfillment', 'hybrid', 'event_pickup')),
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fulfillments_store_status ON fulfillments(store_id, status);
CREATE INDEX IF NOT EXISTS idx_fulfillments_status ON fulfillments(status) WHERE status NOT IN ('Completed', 'Cancelled', 'Failed');

CREATE TABLE IF NOT EXISTS fulfillment_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fulfillment_id UUID NOT NULL REFERENCES fulfillments(id) ON DELETE CASCADE,
  carrier TEXT,
  tracking_code TEXT,
  label_url TEXT,
  status TEXT NOT NULL DEFAULT 'Created'
    CHECK (status IN ('Created', 'Posted', 'InTransit', 'Delivered', 'Exception', 'Lost', 'Returned', 'Cancelled')),
  weight_grams INT,
  posted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  last_tracking_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fulfillment_shipments_tracking
  ON fulfillment_shipments(tracking_code) WHERE tracking_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fulfillment_shipments_fulfillment ON fulfillment_shipments(fulfillment_id);

CREATE TABLE IF NOT EXISTS fulfillment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fulfillment_id UUID NOT NULL REFERENCES fulfillments(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id TEXT,
  event_type TEXT,
  correlation_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_history_fulfillment ON fulfillment_status_history(fulfillment_id, created_at DESC);

-- Domain event outbox (pre-outbox-pattern.md)
CREATE TABLE IF NOT EXISTS domain_event_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlation_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_domain_event_outbox_pending
  ON domain_event_outbox(created_at) WHERE published_at IS NULL;

-- Platform jobs (background-jobs.md)
CREATE TABLE IF NOT EXISTS platform_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'dead_letter', 'cancelled')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  priority INT NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_jobs_pending
  ON platform_jobs(run_after, priority DESC, created_at)
  WHERE status = 'pending';

-- Read model projection for seller panel
CREATE OR REPLACE VIEW seller_fulfillment_projection AS
SELECT
  f.id AS fulfillment_id,
  f.order_id,
  f.store_id,
  f.status AS fulfillment_status,
  f.model,
  f.correlation_id,
  f.accepted_at,
  f.completed_at,
  f.created_at AS fulfillment_created_at,
  f.updated_at AS fulfillment_updated_at,
  o.status AS order_status,
  o.total_cents,
  o.tracking_code AS order_tracking_code,
  o.shipped_at,
  o.delivered_at,
  s.tracking_code AS shipment_tracking_code,
  s.carrier,
  s.label_url,
  s.status AS shipment_status,
  s.last_tracking_event_at
FROM fulfillments f
JOIN shop_orders o ON o.id = f.order_id
LEFT JOIN LATERAL (
  SELECT * FROM fulfillment_shipments fs
  WHERE fs.fulfillment_id = f.id
  ORDER BY fs.created_at DESC
  LIMIT 1
) s ON TRUE;

ALTER TABLE fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_status_history ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE fulfillments IS 'Aggregate Fulfillment — WF-006 state machine oficial';
COMMENT ON TABLE platform_jobs IS 'Background Jobs — WF-013; nunca executar lógica pesada em HTTP';
COMMENT ON VIEW seller_fulfillment_projection IS 'Read model CQRS para painel lojista — pedidos + fulfillment';
