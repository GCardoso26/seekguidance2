-- Fase 1.6: listagens de cartas do catálogo por vendedores (integração shop)

SET search_path TO tcg_judge, public;

-- Categoria "single" para cartas avulsas no marketplace
ALTER TABLE store_products DROP CONSTRAINT IF EXISTS store_products_category_check;
ALTER TABLE store_products ADD CONSTRAINT store_products_category_check
  CHECK (category IN ('booster', 'sleeve', 'deck_box', 'playmat', 'accessory', 'single'));

ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS catalog_card_id UUID REFERENCES card_catalog(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_store_products_catalog_card
  ON store_products(catalog_card_id) WHERE catalog_card_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS card_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES card_catalog(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  store_product_id UUID REFERENCES store_products(id) ON DELETE SET NULL,
  condition VARCHAR(10) NOT NULL CHECK (condition IN ('NM', 'LP', 'MP', 'HP', 'DM')),
  price_cents INT NOT NULL CHECK (price_cents > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  foil BOOLEAN NOT NULL DEFAULT FALSE,
  language VARCHAR(10) NOT NULL DEFAULT 'pt',
  images TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'sold', 'reserved', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT card_listings_unique UNIQUE (card_id, seller_id, condition, foil, language)
);

CREATE INDEX IF NOT EXISTS idx_card_listings_card_id ON card_listings(card_id);
CREATE INDEX IF NOT EXISTS idx_card_listings_seller_id ON card_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_card_listings_store_id ON card_listings(store_id);
CREATE INDEX IF NOT EXISTS idx_card_listings_status ON card_listings(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_card_listings_price ON card_listings(price_cents);

ALTER TABLE card_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY card_listings_select_active ON card_listings
  FOR SELECT USING (status = 'active');

COMMENT ON TABLE card_listings IS 'Listagens de cartas do catálogo por vendedores (marketplace)';
