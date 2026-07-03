-- Schema mínimo para testes de race condition do checkout atômico (testcontainers / CI).
SET search_path TO tcg_judge, public;
CREATE SCHEMA IF NOT EXISTS tcg_judge;

CREATE TABLE IF NOT EXISTS tcg_judge.judge_profiles (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'player'
);

CREATE TABLE IF NOT EXISTS tcg_judge.player_profiles (
  id TEXT PRIMARY KEY,
  handle VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL DEFAULT 'Test',
  account_status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS tcg_judge.notification_preferences (
  player_id TEXT PRIMARY KEY REFERENCES tcg_judge.player_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tcg_judge.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL REFERENCES tcg_judge.player_profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  shop_enabled BOOLEAN NOT NULL DEFAULT true,
  pix_key TEXT,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.15,
  average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tcg_judge.store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES tcg_judge.stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(30) NOT NULL DEFAULT 'accessory',
  price_cents INT NOT NULL CHECK (price_cents > 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tcg_judge.shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES tcg_judge.player_profiles(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS tcg_judge.card_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code TEXT NOT NULL DEFAULT 'MTG',
  external_id TEXT,
  name TEXT NOT NULL DEFAULT 'Test Card',
  normalized_name TEXT NOT NULL DEFAULT 'Test Card'
);

CREATE TABLE IF NOT EXISTS tcg_judge.card_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES tcg_judge.card_catalog(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES tcg_judge.player_profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES tcg_judge.stores(id) ON DELETE CASCADE,
  store_product_id UUID REFERENCES tcg_judge.store_products(id) ON DELETE SET NULL,
  condition VARCHAR(10) NOT NULL DEFAULT 'NM',
  price_cents INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  reserved_quantity INT NOT NULL DEFAULT 0,
  version INT NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION tcg_judge.expire_checkout_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  expired_session RECORD;
  item RECORD;
  expired_count INTEGER := 0;
BEGIN
  FOR expired_session IN
    SELECT id, locked_items
    FROM tcg_judge.checkout_sessions
    WHERE status = 'active' AND expires_at < NOW()
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
    UPDATE tcg_judge.checkout_sessions SET status = 'expired' WHERE id = expired_session.id;
    expired_count := expired_count + 1;
  END LOOP;
  RETURN expired_count;
END;
$$;
