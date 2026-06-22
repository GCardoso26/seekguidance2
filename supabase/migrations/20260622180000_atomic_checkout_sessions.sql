-- Checkout atômico: reserva de estoque + sessões de checkout

SET search_path TO tcg_judge, public;

ALTER TABLE tcg_judge.store_products
  ADD COLUMN IF NOT EXISTS reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0);

ALTER TABLE tcg_judge.card_listings
  ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_store_products_checkout
  ON tcg_judge.store_products(id, stock, reserved_stock)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_card_listings_checkout
  ON tcg_judge.card_listings(id, quantity, reserved_quantity, status)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS tcg_judge.checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES tcg_judge.player_profiles(id) ON DELETE CASCADE,
  cart_id UUID REFERENCES tcg_judge.shopping_carts(id) ON DELETE SET NULL,
  locked_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  payment_intent_id TEXT,
  payment_method VARCHAR(20),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user
  ON tcg_judge.checkout_sessions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_expires
  ON tcg_judge.checkout_sessions(expires_at)
  WHERE status = 'active';

ALTER TABLE tcg_judge.checkout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS checkout_sessions_select_own ON tcg_judge.checkout_sessions;
CREATE POLICY checkout_sessions_select_own
  ON tcg_judge.checkout_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS checkout_sessions_modify_own ON tcg_judge.checkout_sessions;
CREATE POLICY checkout_sessions_modify_own
  ON tcg_judge.checkout_sessions
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE OR REPLACE FUNCTION tcg_judge.expire_checkout_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = tcg_judge, public
AS $$
DECLARE
  expired_session RECORD;
  item RECORD;
  expired_count INTEGER := 0;
BEGIN
  FOR expired_session IN
    SELECT id, locked_items
    FROM tcg_judge.checkout_sessions
    WHERE status = 'active'
      AND expires_at < NOW()
  LOOP
    FOR item IN
      SELECT *
      FROM jsonb_to_recordset(expired_session.locked_items) AS x(
        product_id UUID,
        listing_id UUID,
        quantity INTEGER
      )
    LOOP
      IF item.product_id IS NOT NULL THEN
        UPDATE tcg_judge.store_products
        SET reserved_stock = GREATEST(reserved_stock - item.quantity, 0),
            updated_at = NOW()
        WHERE id = item.product_id;
      END IF;

      IF item.listing_id IS NOT NULL THEN
        UPDATE tcg_judge.card_listings
        SET reserved_quantity = GREATEST(reserved_quantity - item.quantity, 0),
            updated_at = NOW()
        WHERE id = item.listing_id;
      END IF;
    END LOOP;

    UPDATE tcg_judge.checkout_sessions
    SET status = 'expired'
    WHERE id = expired_session.id;

    expired_count := expired_count + 1;
  END LOOP;

  RETURN expired_count;
END;
$$;

COMMENT ON TABLE tcg_judge.checkout_sessions IS 'Sessões de checkout com estoque reservado (SELECT FOR UPDATE)';
