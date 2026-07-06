-- Sprint 6: Payment & Settlement — aggregates Payment, Settlement, LedgerEntry
SET search_path TO tcg_judge, public;

-- Extend shop_orders status for chargebacks (legacy bridge)
ALTER TABLE shop_orders DROP CONSTRAINT IF EXISTS shop_orders_status_check;
ALTER TABLE shop_orders ADD CONSTRAINT shop_orders_status_check
  CHECK (status IN (
    'pending', 'paid', 'processing', 'shipped', 'delivered',
    'cancelled', 'disputed', 'refunded'
  ));

-- Payment aggregate (WF-004)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_order_id UUID UNIQUE REFERENCES shop_orders(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  buyer_id TEXT NOT NULL,
  checkout_session_id UUID,
  status TEXT NOT NULL DEFAULT 'Created'
    CHECK (status IN (
      'Created', 'PendingAuthorization', 'Authorized', 'Captured', 'Approved',
      'Failed', 'Expired', 'Cancelled', 'RefundPending', 'Refunded',
      'Chargeback', 'Disputed'
    )),
  payment_method TEXT NOT NULL DEFAULT 'stripe',
  currency TEXT NOT NULL DEFAULT 'BRL',
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  platform_fee_cents INT NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  store_amount_cents INT NOT NULL DEFAULT 0 CHECK (store_amount_cents >= 0),
  stripe_payment_intent_id TEXT,
  pix_txid TEXT,
  use_escrow BOOLEAN NOT NULL DEFAULT false,
  stripe_transfer_id TEXT,
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE,
  captured_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_store_status ON payments(store_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_pi ON payments(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_pix_txid ON payments(pix_txid) WHERE pix_txid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status_pending ON payments(status)
  WHERE status IN ('Captured', 'Approved', 'Disputed', 'Chargeback');

CREATE TABLE IF NOT EXISTS payment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id TEXT,
  event_type TEXT,
  correlation_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_payment ON payment_status_history(payment_id, created_at DESC);

-- Chargebacks
CREATE TABLE IF NOT EXISTS chargebacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  shop_order_id UUID REFERENCES shop_orders(id) ON DELETE SET NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  stripe_dispute_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'opened'
    CHECK (status IN ('opened', 'under_review', 'won', 'lost', 'closed')),
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  reason TEXT,
  evidence_due_by TIMESTAMPTZ,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chargebacks_store_status ON chargebacks(store_id, status);
CREATE INDEX IF NOT EXISTS idx_chargebacks_payment ON chargebacks(payment_id);

-- Settlements (batch repasse)
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Processing', 'Released', 'Blocked', 'Reconciled', 'Failed')),
  total_cents BIGINT NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  item_count INT NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  stripe_payout_id TEXT,
  batch_key TEXT,
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  blocked_reason TEXT,
  released_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_settlements_batch_key
  ON settlements(batch_key) WHERE batch_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_settlements_store_status ON settlements(store_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS settlement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  shop_order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE RESTRICT,
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (settlement_id, payment_id)
);

CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement ON settlement_items(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_payment ON settlement_items(payment_id);

-- Double-entry ledger
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_group_id UUID NOT NULL,
  account TEXT NOT NULL
    CHECK (account IN (
      'stripe_clearing', 'seller_payable', 'platform_revenue',
      'escrow_hold', 'chargeback_reserve', 'settlement_payable'
    )),
  side TEXT NOT NULL CHECK (side IN ('debit', 'credit')),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  reference_type TEXT NOT NULL
    CHECK (reference_type IN ('payment', 'settlement', 'chargeback', 'reconciliation', 'refund')),
  reference_id UUID NOT NULL,
  description TEXT,
  correlation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_group ON ledger_entries(entry_group_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_reference ON ledger_entries(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries(account, created_at DESC);

-- Webhook dedup v2
ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS payload_hash TEXT,
  ADD COLUMN IF NOT EXISTS correlation_id UUID,
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'completed'
    CHECK (processing_status IN ('processing', 'completed', 'failed'));

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_payload_hash
  ON stripe_webhook_events(payload_hash) WHERE payload_hash IS NOT NULL;

-- Seller read projection
CREATE OR REPLACE VIEW seller_payment_audit_projection AS
SELECT
  p.id AS payment_id,
  p.shop_order_id,
  p.store_id,
  p.status AS payment_status,
  p.payment_method,
  p.amount_cents,
  p.platform_fee_cents,
  p.store_amount_cents,
  p.stripe_payment_intent_id,
  p.pix_txid,
  p.use_escrow,
  p.captured_at,
  p.approved_at,
  p.created_at,
  o.status AS order_status,
  o.stripe_transfer_id AS order_transfer_id,
  cb.id AS chargeback_id,
  cb.status AS chargeback_status,
  si.settlement_id,
  s.status AS settlement_status
FROM payments p
LEFT JOIN shop_orders o ON o.id = p.shop_order_id
LEFT JOIN chargebacks cb ON cb.payment_id = p.id AND cb.status IN ('opened', 'under_review')
LEFT JOIN settlement_items si ON si.payment_id = p.id
LEFT JOIN settlements s ON s.id = si.settlement_id;

COMMENT ON TABLE payments IS 'Payment aggregate root — WF-004 Sprint 6';
COMMENT ON TABLE settlements IS 'Settlement batch aggregate — Sprint 6';
COMMENT ON TABLE ledger_entries IS 'Double-entry ledger for payment/settlement reconciliation';
