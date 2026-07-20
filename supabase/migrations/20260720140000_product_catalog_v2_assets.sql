-- Product Catalog v2 — assets compartilhados, atributos, games, collections, histórico, busca
BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- Asset Service (compartilhado: cartas, produtos, logos, banners…)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media.assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sha256       text NOT NULL,
  storage_key  text,
  width        int,
  height       int,
  mime         text,
  size_bytes   bigint,
  blurhash     text,
  cdn_url      text,
  derivatives  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_media_assets_sha256 ON media.assets (sha256);

CREATE TABLE IF NOT EXISTS media.asset_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id    uuid NOT NULL REFERENCES media.assets(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  role        text NOT NULL DEFAULT 'primary',
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, entity_type, entity_id, role, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_asset_links_entity
  ON media.asset_links (entity_type, entity_id, sort_order);

-- Migração best-effort de product_catalog.images → assets (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'product_catalog' AND table_name = 'images'
  ) THEN
    INSERT INTO media.assets (sha256, cdn_url, width, height, mime, size_bytes)
    SELECT DISTINCT ON (COALESCE(i.sha256, i.id::text))
      COALESCE(i.sha256, 'legacy:' || i.id::text),
      i.url,
      i.width,
      i.height,
      NULL,
      NULL
    FROM product_catalog.images i
    ON CONFLICT (sha256) DO NOTHING;

    INSERT INTO media.asset_links (asset_id, entity_type, entity_id, role, sort_order)
    SELECT a.id, 'product_variant', i.variant_id,
           CASE WHEN i.is_primary THEN 'primary' ELSE 'gallery' END,
           i.sort_order
    FROM product_catalog.images i
    JOIN media.assets a ON a.sha256 = COALESCE(i.sha256, 'legacy:' || i.id::text)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Product type, collections, games M:N, aliases, attributes, fingerprint
-- ---------------------------------------------------------------------------
ALTER TABLE product_catalog.products
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'Accessory'
    CHECK (product_type IN (
      'Accessory', 'Sealed', 'Single', 'Merchandise', 'Apparel', 'Dice', 'Token', 'Storage'
    ));

ALTER TABLE product_catalog.products
  ADD COLUMN IF NOT EXISTS collection_id uuid;

ALTER TABLE product_catalog.products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE TABLE IF NOT EXISTS product_catalog.collections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game         text,
  name         text NOT NULL,
  release_date date,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_catalog.products
  DROP CONSTRAINT IF EXISTS products_collection_id_fkey;
ALTER TABLE product_catalog.products
  ADD CONSTRAINT products_collection_id_fkey
  FOREIGN KEY (collection_id) REFERENCES product_catalog.collections(id);

CREATE TABLE IF NOT EXISTS product_catalog.games (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS product_catalog.product_games (
  product_id uuid NOT NULL REFERENCES product_catalog.products(id) ON DELETE CASCADE,
  game_id    uuid NOT NULL REFERENCES product_catalog.games(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, game_id)
);

INSERT INTO product_catalog.games (code, name) VALUES
  ('MTG', 'Magic: The Gathering'),
  ('POKEMON', 'Pokémon'),
  ('YUGIOH', 'Yu-Gi-Oh!'),
  ('LORCANA', 'Disney Lorcana'),
  ('ONE_PIECE', 'One Piece'),
  ('DIGIMON', 'Digimon'),
  ('DBFW', 'Dragon Ball Fusion World'),
  ('SWU', 'Star Wars: Unlimited'),
  ('GUNDAM', 'Gundam'),
  ('SORCERY', 'Sorcery'),
  ('FAB', 'Flesh and Blood'),
  ('RIFTBOUND', 'Riftbound')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS product_catalog.manufacturer_aliases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id uuid NOT NULL REFERENCES product_catalog.manufacturers(id) ON DELETE CASCADE,
  alias           text NOT NULL,
  normalized_alias text NOT NULL,
  UNIQUE (normalized_alias)
);

CREATE TABLE IF NOT EXISTS product_catalog.brand_aliases (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES product_catalog.brands(id) ON DELETE CASCADE,
  alias    text NOT NULL,
  normalized_alias text NOT NULL,
  UNIQUE (brand_id, normalized_alias)
);

ALTER TABLE product_catalog.variants
  ADD COLUMN IF NOT EXISTS fingerprint text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variant_fingerprint
  ON product_catalog.variants (fingerprint) WHERE fingerprint IS NOT NULL AND fingerprint <> '';

CREATE TABLE IF NOT EXISTS product_catalog.product_attributes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_catalog.variants(id) ON DELETE CASCADE,
  attr_key   text NOT NULL,
  attr_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (variant_id, attr_key, attr_value)
);

CREATE INDEX IF NOT EXISTS idx_product_attributes_key
  ON product_catalog.product_attributes (attr_key, attr_value);

-- Histórico preço / estoque (seller_products)
CREATE TABLE IF NOT EXISTS product_catalog.seller_price_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_product_id uuid NOT NULL REFERENCES product_catalog.seller_products(id) ON DELETE CASCADE,
  store_id         uuid NOT NULL,
  variant_id       uuid NOT NULL,
  price_cents      int NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_price_history_variant
  ON product_catalog.seller_price_history (variant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS product_catalog.seller_stock_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_product_id uuid NOT NULL REFERENCES product_catalog.seller_products(id) ON DELETE CASCADE,
  store_id         uuid NOT NULL,
  variant_id       uuid NOT NULL,
  stock            int NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_stock_history_variant
  ON product_catalog.seller_stock_history (variant_id, created_at DESC);

CREATE OR REPLACE FUNCTION product_catalog.trg_seller_product_history()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.price_cents IS DISTINCT FROM OLD.price_cents THEN
    INSERT INTO product_catalog.seller_price_history (seller_product_id, store_id, variant_id, price_cents)
    VALUES (NEW.id, NEW.store_id, NEW.variant_id, NEW.price_cents);
  END IF;
  IF TG_OP = 'INSERT' OR NEW.stock IS DISTINCT FROM OLD.stock THEN
    INSERT INTO product_catalog.seller_stock_history (seller_product_id, store_id, variant_id, stock)
    VALUES (NEW.id, NEW.store_id, NEW.variant_id, NEW.stock);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS seller_product_history ON product_catalog.seller_products;
CREATE TRIGGER seller_product_history
  AFTER INSERT OR UPDATE OF price_cents, stock ON product_catalog.seller_products
  FOR EACH ROW EXECUTE FUNCTION product_catalog.trg_seller_product_history();

-- Provider registry (health / schedule)
CREATE TABLE IF NOT EXISTS product_catalog.provider_registry (
  provider_id   text PRIMARY KEY,
  category      text NOT NULL,
  enabled       boolean NOT NULL DEFAULT true,
  cron_schedule text,
  last_sync_at  timestamptz,
  last_status   text,
  last_error    text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_catalog.sync_runs
  ADD COLUMN IF NOT EXISTS duration_ms int,
  ADD COLUMN IF NOT EXISTS items_new int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS items_updated int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS items_duplicate int NOT NULL DEFAULT 0;

-- Marketplace futuro (variant_id)
CREATE TABLE IF NOT EXISTS product_catalog.variant_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text NOT NULL,
  variant_id uuid NOT NULL REFERENCES product_catalog.variants(id) ON DELETE CASCADE,
  notify_price_drop boolean NOT NULL DEFAULT false,
  notify_back_in_stock boolean NOT NULL DEFAULT false,
  target_price_cents int,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, variant_id)
);

-- Busca: tsvector + trigram
CREATE OR REPLACE FUNCTION product_catalog.products_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.title_pt, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.normalized_title, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.sku, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.ean, '')), 'C');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS products_search_vector_trg ON product_catalog.products;
CREATE TRIGGER products_search_vector_trg
  BEFORE INSERT OR UPDATE OF title_pt, normalized_title, sku, ean ON product_catalog.products
  FOR EACH ROW EXECUTE FUNCTION product_catalog.products_search_vector_update();

UPDATE product_catalog.products SET title_pt = title_pt;

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON product_catalog.products USING gin (search_vector);

CREATE INDEX IF NOT EXISTS idx_products_title_trgm
  ON product_catalog.products USING gin (title_pt gin_trgm_ops);

COMMIT;
