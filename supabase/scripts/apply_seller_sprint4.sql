-- =============================================================================
-- Judge TCG — Sprint 4 Lojista SaaS (aplicar no SQL Editor do Supabase)
-- Schema: tcg_judge — executar UMA vez
-- =============================================================================

SET search_path TO tcg_judge, public;

ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_subscription_plan_check;
ALTER TABLE stores ADD CONSTRAINT stores_subscription_plan_check
  CHECK (subscription_plan IN ('free', 'lojista', 'pro', 'enterprise'));

CREATE TABLE IF NOT EXISTS buylists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL DEFAULT 'Oferta de compra',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'closed')),
  discount_pct NUMERIC(5, 4) NOT NULL DEFAULT 0.30,
  public_token VARCHAR(32) NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buylists_store ON buylists(store_id);
CREATE INDEX IF NOT EXISTS idx_buylists_token ON buylists(public_token);

CREATE TABLE IF NOT EXISTS buylist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buylist_id UUID NOT NULL REFERENCES buylists(id) ON DELETE CASCADE,
  card_id UUID REFERENCES card_catalog(id) ON DELETE SET NULL,
  card_name VARCHAR(200) NOT NULL,
  set_code VARCHAR(50),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  condition VARCHAR(20) DEFAULT 'near_mint',
  market_cents INT,
  offer_cents INT NOT NULL CHECK (offer_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buylist_items_list ON buylist_items(buylist_id);

CREATE TABLE IF NOT EXISTS buylist_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buylist_id UUID NOT NULL REFERENCES buylists(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  seller_user_id TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  total_offer_cents INT NOT NULL DEFAULT 0 CHECK (total_offer_cents >= 0),
  message TEXT,
  shop_order_id UUID REFERENCES shop_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buylist_submissions_store ON buylist_submissions(store_id);
CREATE INDEX IF NOT EXISTS idx_buylist_submissions_buylist ON buylist_submissions(buylist_id);

CREATE TABLE IF NOT EXISTS store_customers (
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(200),
  total_spent_cents INT NOT NULL DEFAULT 0,
  order_count INT NOT NULL DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  segment VARCHAR(30) NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (store_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_store_customers_segment ON store_customers(store_id, segment);

CREATE TABLE IF NOT EXISTS pdv_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_cents INT NOT NULL CHECK (total_cents >= 0),
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'pix', 'card')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdv_sales_store ON pdv_sales(store_id, created_at DESC);

ALTER TABLE buylists ENABLE ROW LEVEL SECURITY;
ALTER TABLE buylist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE buylist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buylists public read active" ON buylists;
CREATE POLICY "Buylists public read active" ON buylists FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Store owners manage buylists" ON buylists;
CREATE POLICY "Store owners manage buylists" ON buylists FOR ALL USING (
  EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_id = auth.uid()::text)
);

DROP POLICY IF EXISTS "Buylist items public read" ON buylist_items;
CREATE POLICY "Buylist items public read" ON buylist_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM buylists b WHERE b.id = buylist_id AND b.status = 'active')
);

DROP POLICY IF EXISTS "Store owners manage buylist items" ON buylist_items;
CREATE POLICY "Store owners manage buylist items" ON buylist_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM buylists b JOIN stores s ON s.id = b.store_id
    WHERE b.id = buylist_id AND s.owner_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Store owners manage submissions" ON buylist_submissions;
CREATE POLICY "Store owners manage submissions" ON buylist_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_id = auth.uid()::text)
);

DROP POLICY IF EXISTS "Sellers read own submissions" ON buylist_submissions;
CREATE POLICY "Sellers read own submissions" ON buylist_submissions
  FOR SELECT USING (seller_user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users create submissions" ON buylist_submissions;
CREATE POLICY "Users create submissions" ON buylist_submissions
  FOR INSERT WITH CHECK (seller_user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Store owners manage customers" ON store_customers;
CREATE POLICY "Store owners manage customers" ON store_customers FOR ALL USING (
  EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_id = auth.uid()::text)
);

DROP POLICY IF EXISTS "Store owners manage pdv" ON pdv_sales;
CREATE POLICY "Store owners manage pdv" ON pdv_sales FOR ALL USING (
  EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_id = auth.uid()::text)
);
