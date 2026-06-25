-- =============================================================================
-- Judge TCG — Escrow v2 + Mercado (aplicar no SQL Editor do Supabase)
-- Projeto: tcg_judge schema
-- Ordem: executar este arquivo UMA vez (idempotente onde possível)
-- =============================================================================

SET search_path TO tcg_judge, public;

-- ─── 1. Escrow (Sprint 1) ───────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE escrow_status AS ENUM (
    'pending_payment', 'payment_received', 'shipped', 'delivered',
    'disputed', 'resolved', 'released_to_seller', 'refunded_to_buyer', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE RESTRICT,
  buyer_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE RESTRICT,
  seller_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  shipping_cents INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  escrow_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (escrow_fee_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents > 0),
  status escrow_status NOT NULL DEFAULT 'pending_payment',
  payment_method TEXT NOT NULL DEFAULT 'pix'
    CHECK (payment_method IN ('pix', 'credit_card', 'stripe')),
  payment_intent_id TEXT,
  pix_txid TEXT,
  payment_deadline TIMESTAMPTZ,
  shipping_deadline TIMESTAMPTZ,
  confirmation_deadline TIMESTAMPTZ,
  auto_release_at TIMESTAMPTZ,
  dispute_reason TEXT,
  dispute_evidence JSONB,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolution TEXT CHECK (dispute_resolution IS NULL OR dispute_resolution IN ('seller', 'buyer', 'split')),
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_buyer ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_seller ON escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_shop_order ON escrow_transactions(shop_order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_auto_release ON escrow_transactions(auto_release_at)
  WHERE status IN ('payment_received', 'shipped', 'delivered');

CREATE TABLE IF NOT EXISTS escrow_balances (
  user_id TEXT PRIMARY KEY REFERENCES player_profiles(id) ON DELETE CASCADE,
  available_cents INTEGER NOT NULL DEFAULT 0 CHECK (available_cents >= 0),
  pending_cents INTEGER NOT NULL DEFAULT 0 CHECK (pending_cents >= 0),
  total_earned_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_earned_cents >= 0),
  total_withdrawn_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_withdrawn_cents >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION tcg_judge.log_escrow_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history := COALESCE(OLD.status_history, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('from', OLD.status::text, 'to', NEW.status::text, 'at', NOW())
    );
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS escrow_status_history ON escrow_transactions;
CREATE TRIGGER escrow_status_history
  BEFORE UPDATE ON escrow_transactions
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.log_escrow_status_change();

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS escrow_select_own ON escrow_transactions;
CREATE POLICY escrow_select_own ON escrow_transactions
  FOR SELECT USING (
    buyer_id = current_setting('request.jwt.claim.sub', true)
    OR seller_id = current_setting('request.jwt.claim.sub', true)
  );

DROP POLICY IF EXISTS escrow_balance_select_own ON escrow_balances;
CREATE POLICY escrow_balance_select_own ON escrow_balances
  FOR SELECT USING (user_id = current_setting('request.jwt.claim.sub', true));

CREATE TABLE IF NOT EXISTS market_health_scores (
  game_code VARCHAR(40) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  status VARCHAR(20) NOT NULL CHECK (status IN ('bullish', 'neutral', 'bearish')),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (game_code)
);

ALTER TABLE price_alerts
  ADD COLUMN IF NOT EXISTS target_percentage NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS cooldown_hours INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trigger_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE price_alerts DROP CONSTRAINT IF EXISTS price_alerts_price_condition_check;
ALTER TABLE price_alerts ADD CONSTRAINT price_alerts_price_condition_check
  CHECK (price_condition IN ('below', 'above', 'change_up', 'change_down'));

-- ─── 2. Checkout escrow (Sprint 2) ──────────────────────────────────────────

ALTER TABLE shop_orders
  ADD COLUMN IF NOT EXISTS use_escrow BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE shop_orders DROP CONSTRAINT IF EXISTS shop_orders_payment_method_check;
ALTER TABLE shop_orders ADD CONSTRAINT shop_orders_payment_method_check
  CHECK (payment_method IN ('pix', 'stripe', 'escrow_pix', 'escrow_stripe'));

-- Verificação
SELECT 'escrow_transactions' AS tbl, COUNT(*) FROM escrow_transactions
UNION ALL SELECT 'market_health_scores', COUNT(*) FROM market_health_scores;
