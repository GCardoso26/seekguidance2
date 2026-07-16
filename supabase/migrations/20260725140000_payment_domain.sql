-- Sprint 5.5 — Payment bounded context
-- payment.payments · payment.payment_events
-- order_id is domain reference only — NO FK to "order".* / marketplace / catalog

BEGIN;

CREATE SCHEMA IF NOT EXISTS payment;

CREATE TABLE IF NOT EXISTS payment.payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid NOT NULL,
  amount_cents         bigint NOT NULL CHECK (amount_cents > 0),
  currency             text NOT NULL DEFAULT 'BRL' CHECK (currency IN ('BRL')),
  status               text NOT NULL DEFAULT 'CREATED'
    CHECK (status IN ('CREATED', 'REQUESTED', 'AUTHORIZED', 'FAILED', 'CANCELLED')),
  provider             text NOT NULL DEFAULT 'fake'
    CHECK (provider IN ('fake', 'stripe')),
  external_reference   text,
  request_id           text NOT NULL,
  reservation_ids      jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_version          bigint NOT NULL DEFAULT 1,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_request_id
  ON payment.payments (request_id);

CREATE INDEX IF NOT EXISTS idx_payments_order
  ON payment.payments (order_id);

CREATE INDEX IF NOT EXISTS idx_payments_external
  ON payment.payments (external_reference)
  WHERE external_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment.payment_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id   uuid NOT NULL REFERENCES payment.payments(id) ON DELETE CASCADE,
  event_key    text NOT NULL,
  event_type   text NOT NULL,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_key)
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment
  ON payment.payment_events (payment_id);

COMMENT ON COLUMN payment.payments.order_id IS
  'Order domain reference by ID only — no cross-schema FK (PAYMENT_PROVIDER_CONTRACT.md).';
COMMENT ON COLUMN payment.payment_events.event_key IS
  'Webhook idempotency key — duplicate delivery is a no-op.';

COMMIT;
