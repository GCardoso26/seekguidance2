-- Sprint 15: Wishlist backend, shipping read models, buyer analytics projections

SET search_path TO tcg_judge, public;

-- Wishlist lists (multiple lists per buyer)
CREATE TABLE IF NOT EXISTS wishlist_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(80) NOT NULL DEFAULT 'lista',
  is_default BOOLEAN NOT NULL DEFAULT false,
  share_token TEXT UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_lists_user ON wishlist_lists(user_id);

-- Wishlist items
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES wishlist_lists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
  product_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (list_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_list ON wishlist_items(list_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product ON wishlist_items(product_id);

-- Legacy flat wishlist view (buyer_dashboard compatibility)
CREATE OR REPLACE VIEW wishlists AS
  SELECT
    wi.id,
    wi.user_id,
    wi.product_id,
    wi.product_snapshot AS product,
    wi.created_at AS added_at
  FROM wishlist_items wi
  JOIN wishlist_lists wl ON wl.id = wi.list_id
  WHERE wl.is_default = true;

COMMENT ON TABLE wishlist_lists IS 'Sprint 15 — listas de desejos do comprador';
COMMENT ON TABLE wishlist_items IS 'Sprint 15 — itens de wishlist por lista';

-- Shipping read model cache
CREATE TABLE IF NOT EXISTS shipping_quote_read_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  destination_postal_code VARCHAR(12) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source VARCHAR(40) NOT NULL DEFAULT 'heuristic',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_quote_user ON shipping_quote_read_model(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_quote_expires ON shipping_quote_read_model(expires_at);

-- Buyer analytics projections (CQRS read models)
CREATE TABLE IF NOT EXISTS buyer_analytics_projection (
  user_id TEXT NOT NULL,
  projection_key VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, projection_key)
);

CREATE INDEX IF NOT EXISTS idx_buyer_analytics_computed ON buyer_analytics_projection(computed_at DESC);

-- Buyer cohort read models
CREATE TABLE IF NOT EXISTS buyer_cohort_projection (
  cohort_key VARCHAR(80) NOT NULL,
  period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly')),
  bucket_date DATE NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cohort_key, period, bucket_date)
);

CREATE INDEX IF NOT EXISTS idx_buyer_cohort_period ON buyer_cohort_projection(period, bucket_date DESC);

-- Image health telemetry (Epic 7)
CREATE TABLE IF NOT EXISTS image_health_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_hash VARCHAR(64) NOT NULL,
  url_host VARCHAR(120),
  event_type VARCHAR(40) NOT NULL,
  latency_ms INT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_health_type ON image_health_events(event_type, created_at DESC);

-- RLS
ALTER TABLE wishlist_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own wishlist lists" ON wishlist_lists;
CREATE POLICY "Users manage own wishlist lists" ON wishlist_lists
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true))
  WITH CHECK (user_id = current_setting('request.jwt.claim.sub', true));

DROP POLICY IF EXISTS "Users manage own wishlist items" ON wishlist_items;
CREATE POLICY "Users manage own wishlist items" ON wishlist_items
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true))
  WITH CHECK (user_id = current_setting('request.jwt.claim.sub', true));
