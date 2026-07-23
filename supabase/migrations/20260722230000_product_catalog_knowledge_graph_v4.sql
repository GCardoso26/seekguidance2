-- Product Catalog Platform V4 — Product Knowledge Graph (official data only, no AI)
-- Extends Product Catalog only. No new BC. No Asset BC changes. No new events.
BEGIN;

-- ---------------------------------------------------------------------------
-- Publishers (knowledge graph root)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog.publishers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,
  name       text NOT NULL,
  website    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO product_catalog.publishers (code, name, website) VALUES
  ('WOTC', 'Wizards of the Coast', 'https://magic.wizards.com'),
  ('TPC', 'The Pokémon Company', 'https://www.pokemon.com'),
  ('KONAMI', 'Konami', 'https://www.yugioh-card.com'),
  ('RAVENSBURGER', 'Ravensburger', 'https://www.disneylorcana.com'),
  ('BANDAI', 'Bandai', 'https://www.bandai.com'),
  ('FFG', 'Fantasy Flight Games', 'https://www.fantasyflightgames.com'),
  ('LSS', 'Legend Story Studios', 'https://fabtcg.com'),
  ('RIOT', 'Riot Games', 'https://riftbound.leagueoflegends.com')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Product family + lifecycle + taxonomy fields on products
-- ---------------------------------------------------------------------------
ALTER TABLE product_catalog.products
  ADD COLUMN IF NOT EXISTS publisher_id uuid REFERENCES product_catalog.publishers(id),
  ADD COLUMN IF NOT EXISTS product_family text,
  ADD COLUMN IF NOT EXISTS lifecycle text NOT NULL DEFAULT 'AVAILABLE',
  ADD COLUMN IF NOT EXISTS series text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS msrp_cents integer,
  ADD COLUMN IF NOT EXISTS upc text,
  ADD COLUMN IF NOT EXISTS isbn text,
  ADD COLUMN IF NOT EXISTS weight_grams numeric,
  ADD COLUMN IF NOT EXISTS legal_status text,
  ADD COLUMN IF NOT EXISTS edition text,
  ADD COLUMN IF NOT EXISTS product_line text,
  ADD COLUMN IF NOT EXISTS knowledge_completeness numeric(5,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE product_catalog.products
    ADD CONSTRAINT products_lifecycle_check CHECK (lifecycle IN (
      'ANNOUNCED', 'PREVIEW', 'PREORDER', 'AVAILABLE',
      'LOW_STOCK', 'OUT_OF_PRINT', 'DISCONTINUED', 'HISTORICAL'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_lifecycle
  ON product_catalog.products (lifecycle);

CREATE INDEX IF NOT EXISTS idx_products_product_family
  ON product_catalog.products (product_family) WHERE product_family IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_publisher
  ON product_catalog.products (publisher_id) WHERE publisher_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Collections enrichment
-- ---------------------------------------------------------------------------
ALTER TABLE product_catalog.collections
  ADD COLUMN IF NOT EXISTS publisher_id uuid REFERENCES product_catalog.publishers(id),
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS expansion_code text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS official boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS uq_collections_slug
  ON product_catalog.collections (slug) WHERE slug IS NOT NULL AND slug <> '';

-- ---------------------------------------------------------------------------
-- Official Product Contents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog.official_product_contents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES product_catalog.products(id) ON DELETE CASCADE,
  source          text NOT NULL DEFAULT 'official',
  publisher       text,
  manufacturer    text,
  release_notes   text,
  decklist_url    text,
  pdf_url         text,
  msrp_cents      integer,
  official        boolean NOT NULL DEFAULT true,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

CREATE TABLE IF NOT EXISTS product_catalog.product_content_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contents_id     uuid NOT NULL REFERENCES product_catalog.official_product_contents(id) ON DELETE CASCADE,
  content_type    text NOT NULL,
  label           text NOT NULL,
  quantity        numeric NOT NULL DEFAULT 1,
  unit            text NOT NULL DEFAULT 'pcs',
  sku_ref         text,
  sort_order      integer NOT NULL DEFAULT 0,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_items_contents
  ON product_catalog.product_content_items (contents_id, sort_order);

-- ---------------------------------------------------------------------------
-- Official Specifications (structured, not free-form metadata)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog.product_specifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES product_catalog.products(id) ON DELETE CASCADE,
  spec_schema     text NOT NULL,
  -- Common structured fields (nullable when N/A for schema)
  width_mm        numeric,
  height_mm       numeric,
  depth_mm        numeric,
  thickness_mm    numeric,
  weight_grams    numeric,
  capacity        integer,
  pieces          integer,
  microns         integer,
  material        text,
  finish          text,
  color           text,
  closure         text,
  surface         text,
  pvc_free        boolean,
  acid_free       boolean,
  water_resistant boolean,
  stitched_border boolean,
  rubber_thickness_mm numeric,
  cards_count     integer,
  foils_count     integer,
  language        text,
  region          text,
  msrp_cents      integer,
  extra           jsonb NOT NULL DEFAULT '{}'::jsonb,
  source          text NOT NULL DEFAULT 'official',
  official        boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, spec_schema)
);

CREATE INDEX IF NOT EXISTS idx_product_specs_schema
  ON product_catalog.product_specifications (spec_schema);

-- ---------------------------------------------------------------------------
-- Universal Metadata Schema (normalized official fields)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog.product_official_metadata (
  product_id      uuid PRIMARY KEY REFERENCES product_catalog.products(id) ON DELETE CASCADE,
  publisher       text,
  manufacturer    text,
  game            text,
  expansion       text,
  collection      text,
  series          text,
  release_date    date,
  language        text,
  country         text,
  msrp_cents      integer,
  sku             text,
  upc             text,
  ean             text,
  isbn            text,
  weight_grams    numeric,
  dimensions      jsonb NOT NULL DEFAULT '{}'::jsonb,
  contents_summary text,
  materials       text,
  finish          text,
  rarity          text,
  product_line    text,
  product_family  text,
  edition         text,
  legal_status    text,
  lifecycle       text,
  asset_trust     integer,
  asset_score     integer,
  source          text NOT NULL DEFAULT 'official',
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Cross-entity relationships (product ↔ game / family) — official only
-- ---------------------------------------------------------------------------
ALTER TABLE product_catalog.product_relationships
  DROP CONSTRAINT IF EXISTS product_relationships_relation_type_check;

ALTER TABLE product_catalog.product_relationships
  ADD CONSTRAINT product_relationships_relation_type_check CHECK (relation_type IN (
    'contains', 'contained_in', 'compatible_with', 'recommended_with',
    'replacement_for', 'variant_of', 'bundle_of', 'requires',
    'accessory_for', 'expansion_of', 'collection_of', 'promo_for',
    'includes', 'included_by', 'supports', 'recommended_for'
  ));

ALTER TABLE product_catalog.product_relationships
  ALTER COLUMN to_product_id DROP NOT NULL;

ALTER TABLE product_catalog.product_relationships
  ADD COLUMN IF NOT EXISTS to_game_code text,
  ADD COLUMN IF NOT EXISTS to_entity_type text NOT NULL DEFAULT 'product'
    CHECK (to_entity_type IN ('product', 'game', 'product_family', 'collection')),
  ADD COLUMN IF NOT EXISTS to_entity_ref text;

ALTER TABLE product_catalog.product_relationships
  DROP CONSTRAINT IF EXISTS uq_product_relationship;

ALTER TABLE product_catalog.product_relationships
  DROP CONSTRAINT IF EXISTS chk_product_relationship_not_self;

-- Stable target key for ON CONFLICT upserts (product or cross-entity)
ALTER TABLE product_catalog.product_relationships
  ADD COLUMN IF NOT EXISTS target_key text;

UPDATE product_catalog.product_relationships
SET target_key = CASE
  WHEN to_product_id IS NOT NULL THEN 'p:' || to_product_id::text
  ELSE 'e:' || coalesce(to_entity_type, 'product') || ':'
       || coalesce(to_entity_ref, '') || ':' || coalesce(to_game_code, '')
END
WHERE target_key IS NULL;

ALTER TABLE product_catalog.product_relationships
  ALTER COLUMN target_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_relationship_target
  ON product_catalog.product_relationships (from_product_id, relation_type, target_key);

ALTER TABLE product_catalog.product_relationships
  DROP CONSTRAINT IF EXISTS chk_product_relationship_target;

ALTER TABLE product_catalog.product_relationships
  ADD CONSTRAINT chk_product_relationship_target
  CHECK (
    to_product_id IS NOT NULL
    OR to_game_code IS NOT NULL
    OR to_entity_ref IS NOT NULL
  );

ALTER TABLE product_catalog.product_relationships
  DROP CONSTRAINT IF EXISTS chk_product_relationship_not_self_v4;

ALTER TABLE product_catalog.product_relationships
  ADD CONSTRAINT chk_product_relationship_not_self_v4
  CHECK (to_product_id IS NULL OR from_product_id <> to_product_id);

-- ---------------------------------------------------------------------------
-- Universal Asset Package registry (pointers into media.assets via entity links)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog.product_asset_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES product_catalog.products(id) ON DELETE CASCADE,
  package_kind    text NOT NULL CHECK (package_kind IN (
    'images', 'pdf', 'rules', 'decklist', 'marketing_kit', 'release_notes',
    'press_kit', 'videos', 'icons', 'logos', 'banners', 'social', 'editorial'
  )),
  title           text,
  source_url      text,
  asset_id        uuid,
  role            text,
  language        text,
  source_trust    integer NOT NULL DEFAULT 80,
  official        boolean NOT NULL DEFAULT true,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_asset_packages_product
  ON product_catalog.product_asset_packages (product_id, package_kind);

-- ---------------------------------------------------------------------------
-- Knowledge coverage snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog.knowledge_coverage_snapshots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_pct       numeric(5,2) NOT NULL DEFAULT 0,
  report            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMIT;
