-- PDV local products: convenience / non-catalog items for in-store POS only.
-- Isolated from product_catalog, knowledge graph, marketplace listings, and public search.

CREATE SCHEMA IF NOT EXISTS pdv;

REVOKE USAGE ON SCHEMA pdv FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS pdv.local_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NULL,
  barcode TEXT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('Snack', 'Bebida', 'Booster', 'Serviço', 'Taxa', 'Acessório', 'Outros')),
  price_cents INT NOT NULL CHECK (price_cents >= 0),
  cost_cents INT NULL CHECK (cost_cents IS NULL OR cost_cents >= 0),
  stock INT NULL CHECK (stock IS NULL OR stock >= 0),
  minimum_stock INT NULL CHECK (minimum_stock IS NULL OR minimum_stock >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  item_kind TEXT NOT NULL DEFAULT 'goods'
    CHECK (item_kind IN ('goods', 'consumable', 'service', 'fee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdv_local_products_store_active
  ON pdv.local_products (store_id, active);

CREATE INDEX IF NOT EXISTS idx_pdv_local_products_store_name
  ON pdv.local_products (store_id, lower(name));

CREATE INDEX IF NOT EXISTS idx_pdv_local_products_store_barcode
  ON pdv.local_products (store_id, barcode)
  WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pdv_local_products_store_sku
  ON pdv.local_products (store_id, sku)
  WHERE sku IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pdv_local_products_store_barcode
  ON pdv.local_products (store_id, barcode)
  WHERE barcode IS NOT NULL;

COMMENT ON TABLE pdv.local_products IS
  'PDV-only local products (snacks, fees, services). Never synced to catalog/marketplace/search.';
COMMENT ON COLUMN pdv.local_products.stock IS
  'NULL means infinite stock (services/fees). Finite stock is decremented on PDV sale.';
COMMENT ON COLUMN pdv.local_products.item_kind IS
  'Reserved for future consumable/service/fiscal reporting without coupling to catalog.';

ALTER TABLE pdv.local_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pdv_local_products_owner ON pdv.local_products;
CREATE POLICY pdv_local_products_owner ON pdv.local_products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tcg_judge.stores s
      WHERE s.id = local_products.store_id
        AND s.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tcg_judge.stores s
      WHERE s.id = local_products.store_id
        AND s.owner_id = auth.uid()::text
    )
  );
