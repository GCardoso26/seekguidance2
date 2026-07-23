-- P2 remediation: asset package identity + collections.code uniqueness
BEGIN;

-- Deduplicate asset packages before unique index (keep oldest)
DELETE FROM product_catalog.product_asset_packages a
USING product_catalog.product_asset_packages b
WHERE a.id > b.id
  AND a.product_id = b.product_id
  AND a.package_kind = b.package_kind
  AND coalesce(a.source_url, '') = coalesce(b.source_url, '')
  AND coalesce(a.role, '') = coalesce(b.role, '');

ALTER TABLE product_catalog.product_asset_packages
  ADD COLUMN IF NOT EXISTS identity_key text;

UPDATE product_catalog.product_asset_packages
SET identity_key = product_id::text || '|' || package_kind || '|'
  || coalesce(source_url, '') || '|' || coalesce(role, '')
WHERE identity_key IS NULL OR identity_key = '';

ALTER TABLE product_catalog.product_asset_packages
  ALTER COLUMN identity_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_asset_packages_identity
  ON product_catalog.product_asset_packages (identity_key);

-- Deduplicate collections by code (keep oldest)
DELETE FROM product_catalog.collections a
USING product_catalog.collections b
WHERE a.id > b.id
  AND a.code IS NOT NULL AND a.code <> ''
  AND a.code = b.code;

CREATE UNIQUE INDEX IF NOT EXISTS uq_collections_code
  ON product_catalog.collections (code)
  WHERE code IS NOT NULL AND code <> '';

COMMIT;
