-- Marketplace MVP: produtos físicos, carrinho, pedidos, Stripe Connect

SET search_path TO tcg_judge, public;

-- Extensão da tabela stores existente
ALTER TABLE stores ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.15;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS shop_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);

CREATE INDEX IF NOT EXISTS idx_stores_shop ON stores(shop_enabled) WHERE shop_enabled = true;
CREATE INDEX IF NOT EXISTS idx_stores_stripe ON stores(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- Produtos da loja
CREATE TABLE IF NOT EXISTS store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  tcg_id VARCHAR(40),
  category VARCHAR(30) NOT NULL
    CHECK (category IN ('booster', 'sleeve', 'deck_box', 'playmat', 'accessory')),
  price_cents INT NOT NULL CHECK (price_cents > 0),
  compare_at_price_cents INT CHECK (compare_at_price_cents IS NULL OR compare_at_price_cents > 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku VARCHAR(64),
  images TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_products_store ON store_products(store_id);
CREATE INDEX IF NOT EXISTS idx_store_products_category ON store_products(category);
CREATE INDEX IF NOT EXISTS idx_store_products_tcg ON store_products(tcg_id);
CREATE INDEX IF NOT EXISTS idx_store_products_active ON store_products(is_active) WHERE is_active = true;

-- Carrinho (1 por usuário)
CREATE TABLE IF NOT EXISTS shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE UNIQUE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_carts_user ON shopping_carts(user_id);

-- Pedidos
CREATE TABLE IF NOT EXISTS shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_cents INT NOT NULL CHECK (total_cents > 0),
  platform_fee_cents INT NOT NULL DEFAULT 0,
  store_receives_cents INT NOT NULL DEFAULT 0,
  shipping_fee_cents INT NOT NULL DEFAULT 0,
  shipping_address JSONB,
  stripe_payment_intent_id TEXT,
  stripe_transfer_group TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_buyer ON shop_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_store ON shop_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_pi ON shop_orders(stripe_payment_intent_id);

CREATE TABLE IF NOT EXISTS shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES store_products(id) ON DELETE RESTRICT,
  product_name VARCHAR(200) NOT NULL,
  product_image TEXT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_cents INT NOT NULL CHECK (unit_price_cents > 0),
  total_price_cents INT NOT NULL CHECK (total_price_cents > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(order_id);

-- RLS
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store products public read" ON store_products;
CREATE POLICY "Store products public read" ON store_products
  FOR SELECT USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.shop_enabled = true)
  );

DROP POLICY IF EXISTS "Store owners manage products" ON store_products;
CREATE POLICY "Store owners manage products" ON store_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_id = auth.uid()::text)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Cart own" ON shopping_carts;
CREATE POLICY "Cart own" ON shopping_carts
  FOR ALL USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Orders buyer read" ON shop_orders;
CREATE POLICY "Orders buyer read" ON shop_orders
  FOR SELECT USING (buyer_id = auth.uid()::text);

DROP POLICY IF EXISTS "Orders store owner" ON shop_orders;
CREATE POLICY "Orders store owner" ON shop_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Order items via order" ON shop_order_items;
CREATE POLICY "Order items via order" ON shop_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shop_orders o
      WHERE o.id = order_id
        AND (o.buyer_id = auth.uid()::text
          OR EXISTS (SELECT 1 FROM stores s WHERE s.id = o.store_id AND s.owner_id = auth.uid()::text))
    )
  );
