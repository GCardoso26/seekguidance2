-- Catálogo Mestre — produtos selados e acessórios (desacoplado de cartas)
BEGIN;

CREATE SCHEMA IF NOT EXISTS product_catalog;

-- ---------------------------------------------------------------------------
-- Fabricantes e marcas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog.manufacturers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  website    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_manufacturers_name_lower
  ON product_catalog.manufacturers (lower(trim(name)));

CREATE TABLE IF NOT EXISTS product_catalog.brands (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id uuid NOT NULL REFERENCES product_catalog.manufacturers(id),
  name            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (manufacturer_id, name)
);

-- ---------------------------------------------------------------------------
-- Produtos, variantes, imagens
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog.products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        uuid REFERENCES product_catalog.brands(id),
  manufacturer_id uuid REFERENCES product_catalog.manufacturers(id),
  category        text NOT NULL CHECK (category IN (
    'SEALED_PRODUCT', 'SLEEVES', 'DECK_BOX', 'BINDER', 'BINDER_PAGE',
    'DICE', 'COUNTERS', 'PLAYMAT'
  )),
  subcategory     text NOT NULL,
  sku             text,
  ean             text,
  title           text NOT NULL,
  title_pt        text NOT NULL,
  normalized_title text NOT NULL,
  description     text,
  game            text,
  release_date    date,
  discontinued    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_catalog_sku
  ON product_catalog.products (sku) WHERE sku IS NOT NULL AND sku <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_catalog_ean
  ON product_catalog.products (ean) WHERE ean IS NOT NULL AND ean <> '';

CREATE INDEX IF NOT EXISTS idx_product_catalog_category
  ON product_catalog.products (category, subcategory);

CREATE INDEX IF NOT EXISTS idx_product_catalog_game
  ON product_catalog.products (game) WHERE game IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_catalog_normalized_title
  ON product_catalog.products (normalized_title);

CREATE TABLE IF NOT EXISTS product_catalog.variants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES product_catalog.products(id) ON DELETE CASCADE,
  color        text,
  size         text,
  language     text DEFAULT 'pt-BR',
  edition      text,
  finish       text,
  variant_name text NOT NULL,
  sku          text,
  ean          text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variant_sku
  ON product_catalog.variants (sku) WHERE sku IS NOT NULL AND sku <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variant_ean
  ON product_catalog.variants (ean) WHERE ean IS NOT NULL AND ean <> '';

CREATE INDEX IF NOT EXISTS idx_product_variants_product
  ON product_catalog.variants (product_id);

CREATE TABLE IF NOT EXISTS product_catalog.images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_catalog.variants(id) ON DELETE CASCADE,
  url        text NOT NULL,
  sha256     text,
  sort_order int NOT NULL DEFAULT 0,
  width      int,
  height     int,
  source     text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_variant
  ON product_catalog.images (variant_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_images_variant_sha
  ON product_catalog.images (variant_id, sha256) WHERE sha256 IS NOT NULL;

-- Ofertas do lojista (somente estoque/preço/condição)
CREATE TABLE IF NOT EXISTS product_catalog.seller_products (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   uuid NOT NULL,
  variant_id uuid NOT NULL REFERENCES product_catalog.variants(id),
  stock      int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  price_cents int NOT NULL CHECK (price_cents > 0),
  condition  text NOT NULL CHECK (condition IN (
    'NEW', 'LIKE_NEW', 'GOOD', 'PLAYED', 'HEAVILY_PLAYED', 'DAMAGED'
  )),
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, variant_id, condition)
);

CREATE INDEX IF NOT EXISTS idx_seller_products_store
  ON product_catalog.seller_products (store_id);

-- Bridge opcional para checkout legado (store_products)
ALTER TABLE tcg_judge.store_products
  ADD COLUMN IF NOT EXISTS master_variant_id uuid;

-- Mapeamento provider → entidade (dedup / sync incremental)
CREATE TABLE IF NOT EXISTS product_catalog.provider_mappings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id         text NOT NULL,
  provider_object_type text NOT NULL CHECK (provider_object_type IN ('PRODUCT', 'VARIANT', 'IMAGE')),
  provider_ref        text NOT NULL,
  product_id          uuid REFERENCES product_catalog.products(id) ON DELETE CASCADE,
  variant_id          uuid REFERENCES product_catalog.variants(id) ON DELETE CASCADE,
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, provider_object_type, provider_ref)
);

-- Execuções de sync (dashboard admin)
CREATE TABLE IF NOT EXISTS product_catalog.sync_runs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_key      text NOT NULL,
  provider_id  text NOT NULL,
  status       text NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  mode         text NOT NULL DEFAULT 'incremental' CHECK (mode IN ('full', 'incremental')),
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  items_seen   int NOT NULL DEFAULT 0,
  items_upserted int NOT NULL DEFAULT 0,
  errors       jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_product_sync_runs_job
  ON product_catalog.sync_runs (job_key, started_at DESC);

COMMIT;
