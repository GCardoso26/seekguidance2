-- Sprint 1: idempotência webhooks Stripe + rastreio de Transfer por pedido

SET search_path TO tcg_judge, public;

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed
  ON stripe_webhook_events(processed_at DESC);

ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_orders_stripe_transfer_id
  ON shop_orders(stripe_transfer_id)
  WHERE stripe_transfer_id IS NOT NULL;

COMMENT ON TABLE stripe_webhook_events IS 'Dedup global de event.id Stripe — Sprint 1';
