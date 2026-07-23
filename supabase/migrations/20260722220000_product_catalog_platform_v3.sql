-- Product Catalog Platform V3 extensions (relationships, asset versions, health snapshots)
-- No new BC. No Asset BC schema changes. No public event contracts.
BEGIN;

-- ---------------------------------------------------------------------------
-- Product Relationship Engine
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog.product_relationships (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_product_id   uuid NOT NULL REFERENCES product_catalog.products(id) ON DELETE CASCADE,
  to_product_id     uuid NOT NULL REFERENCES product_catalog.products(id) ON DELETE CASCADE,
  relation_type     text NOT NULL CHECK (relation_type IN (
    'contains', 'contained_in', 'compatible_with', 'recommended_with',
    'replacement_for', 'variant_of', 'bundle_of', 'requires',
    'accessory_for', 'expansion_of', 'collection_of', 'promo_for',
    'includes', 'included_by'
  )),
  source            text NOT NULL DEFAULT 'official',
  confidence        numeric(5,4) NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  official          boolean NOT NULL DEFAULT true,
  publisher         text,
  manufacturer      text,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_relationship UNIQUE (from_product_id, to_product_id, relation_type),
  CONSTRAINT chk_product_relationship_not_self CHECK (from_product_id <> to_product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_rel_from
  ON product_catalog.product_relationships (from_product_id, relation_type);

CREATE INDEX IF NOT EXISTS idx_product_rel_to
  ON product_catalog.product_relationships (to_product_id, relation_type);

CREATE INDEX IF NOT EXISTS idx_product_rel_official
  ON product_catalog.product_relationships (official) WHERE official = true;

-- ---------------------------------------------------------------------------
-- Asset Version History (Product Catalog extension — references asset id only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog.asset_version_history (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          uuid NOT NULL,
  entity_type       text NOT NULL,
  entity_id         text NOT NULL,
  version_number    integer NOT NULL CHECK (version_number >= 1),
  source            text NOT NULL,
  source_trust      integer NOT NULL DEFAULT 0,
  quality_score     integer NOT NULL DEFAULT 0,
  sha256            text NOT NULL,
  width             integer,
  height            integer,
  format            text,
  size_bytes        bigint,
  cdn_url           text,
  pipeline_version  text NOT NULL DEFAULT 'v2',
  derivatives       jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  is_current        boolean NOT NULL DEFAULT false,
  CONSTRAINT uq_asset_version UNIQUE (asset_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_asset_version_entity
  ON product_catalog.asset_version_history (entity_type, entity_id, is_current);

CREATE INDEX IF NOT EXISTS idx_asset_version_asset
  ON product_catalog.asset_version_history (asset_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_asset_version_sha
  ON product_catalog.asset_version_history (sha256);

-- ---------------------------------------------------------------------------
-- Asset Health snapshots (admin analytics — no Analytics BC)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog.asset_health_snapshots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope             text NOT NULL DEFAULT 'global',
  scope_key         text NOT NULL DEFAULT 'all',
  overall_pct       numeric(5,2) NOT NULL DEFAULT 0,
  report            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_health_scope
  ON product_catalog.asset_health_snapshots (scope, scope_key, created_at DESC);

COMMIT;
