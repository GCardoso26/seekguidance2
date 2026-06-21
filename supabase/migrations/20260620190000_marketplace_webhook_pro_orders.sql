-- Webhook PIX, Pro Loja billing, pedidos, avaliações e cupons

SET search_path TO tcg_judge, public;

-- PIX: payload do gateway + identificador externo
ALTER TABLE pix_transactions ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE pix_transactions ADD COLUMN IF NOT EXISTS webhook_payload JSONB;
ALTER TABLE pix_transactions ADD COLUMN IF NOT EXISTS gateway_provider TEXT;
ALTER TABLE pix_transactions ADD COLUMN IF NOT EXISTS gateway_charge_id TEXT;
ALTER TABLE pix_transactions ADD COLUMN IF NOT EXISTS pix_key_type TEXT;

CREATE INDEX IF NOT EXISTS idx_pix_transactions_gateway
  ON pix_transactions(gateway_charge_id) WHERE gateway_charge_id IS NOT NULL;

-- Pedidos: fulfillment
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS coupon_id UUID;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS discount_cents INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS shop_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  changed_by TEXT REFERENCES player_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_order_history_order ON shop_order_status_history(order_id);

-- Assinaturas Pro Loja (billing)
ALTER TABLE store_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE store_subscriptions ADD COLUMN IF NOT EXISTS payment_method TEXT
  CHECK (payment_method IS NULL OR payment_method IN ('pix', 'card'));
ALTER TABLE store_subscriptions ADD COLUMN IF NOT EXISTS pix_transaction_id UUID REFERENCES pix_transactions(id);
ALTER TABLE store_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE stores ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Avaliações pós-compra
CREATE TABLE IF NOT EXISTS shop_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES shop_orders(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  photos TEXT[] NOT NULL DEFAULT '{}',
  store_response TEXT,
  store_responded_at TIMESTAMPTZ,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_reviews_store ON shop_reviews(store_id) WHERE is_visible = TRUE;

-- Cupons por loja
CREATE TABLE IF NOT EXISTS shop_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value_cents INT NOT NULL CHECK (value_cents > 0),
  min_order_cents INT NOT NULL DEFAULT 0,
  max_discount_cents INT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  max_uses INT,
  current_uses INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, code)
);

CREATE TABLE IF NOT EXISTS shop_coupon_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES shop_coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  discount_cents INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coupon_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_coupons_store ON shop_coupons(store_id);
CREATE INDEX IF NOT EXISTS idx_shop_coupons_code ON shop_coupons(UPPER(code));
