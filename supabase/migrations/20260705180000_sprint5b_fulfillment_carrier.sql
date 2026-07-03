-- Sprint 5b: Melhor Envio, webhooks transportadora, SLA timestamps
SET search_path TO tcg_judge, public;

ALTER TABLE fulfillment_shipments ADD COLUMN IF NOT EXISTS external_provider TEXT;
ALTER TABLE fulfillment_shipments ADD COLUMN IF NOT EXISTS external_shipment_id TEXT;
ALTER TABLE fulfillment_shipments ADD COLUMN IF NOT EXISTS external_protocol TEXT;
ALTER TABLE fulfillment_shipments ADD COLUMN IF NOT EXISTS cart_item_id TEXT;
ALTER TABLE fulfillment_shipments ADD COLUMN IF NOT EXISTS tracking_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fulfillment_shipments_external
  ON fulfillment_shipments(external_provider, external_shipment_id)
  WHERE external_shipment_id IS NOT NULL;

ALTER TABLE fulfillments ADD COLUMN IF NOT EXISTS picking_started_at TIMESTAMPTZ;
ALTER TABLE fulfillments ADD COLUMN IF NOT EXISTS packed_at TIMESTAMPTZ;
ALTER TABLE fulfillments ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

ALTER TABLE stores ADD COLUMN IF NOT EXISTS shipping_settings JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS carrier_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_shipment_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_carrier_webhook_pending
  ON carrier_webhook_events(received_at) WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_carrier_webhook_shipment
  ON carrier_webhook_events(external_shipment_id) WHERE external_shipment_id IS NOT NULL;

-- Recreate projection with carrier fields (DROP required — PG não permite renomear colunas via OR REPLACE)
DROP VIEW IF EXISTS seller_fulfillment_projection;

CREATE VIEW seller_fulfillment_projection AS
SELECT
  f.id AS fulfillment_id,
  f.order_id,
  f.store_id,
  f.status AS fulfillment_status,
  f.model,
  f.correlation_id,
  f.accepted_at,
  f.picking_started_at,
  f.packed_at,
  f.shipped_at AS fulfillment_shipped_at,
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
  s.tracking_url,
  s.external_provider,
  s.external_shipment_id,
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

COMMENT ON VIEW seller_fulfillment_projection IS 'Read model CQRS para painel lojista — pedidos + fulfillment + SLA';

COMMENT ON TABLE carrier_webhook_events IS 'Idempotência CarrierWebhookReceived — WF-006';
