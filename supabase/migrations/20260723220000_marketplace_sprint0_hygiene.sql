-- Sprint 0: marketplace public hygiene
-- Flag test stores and keep junk off the public storefront.

ALTER TABLE tcg_judge.stores
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN tcg_judge.stores.is_test IS
  'When true, store listings are excluded from public marketplace browse/search/PDP.';

CREATE INDEX IF NOT EXISTS idx_stores_is_test
  ON tcg_judge.stores (is_test)
  WHERE is_test = true;

-- Mark known sandbox / debug storefronts (avoid false positives like "contest").
UPDATE tcg_judge.stores
SET is_test = true,
    updated_at = now()
WHERE is_test = false
  AND (
    slug ILIKE '%teste%'
    OR slug ILIKE '%debug%'
    OR slug ~* '(^|-)(test|teste|debug)(-|$)'
    OR name ILIKE '%teste%'
    OR name ILIKE '%debug%'
    OR name ~* '(^|[^[:alnum:]])(test|teste|debug)([^[:alnum:]]|$)'
  );

-- Soft-deactivate junk / seed / persona listings (public hygiene purge).
UPDATE tcg_judge.store_products p
SET is_active = false,
    updated_at = now()
WHERE p.is_active = true
  AND (
    p.store_id IN (SELECT id FROM tcg_judge.stores WHERE is_test = true)
    OR p.name ILIKE '%teste%'
    OR p.name ILIKE '%test %'
    OR p.name ILIKE 'test %'
    OR p.name ILIKE '%seed%'
    OR p.name ~* 'carta[[:space:]]*#'
    OR COALESCE(p.description, '') ILIKE '%seed persona%'
    OR COALESCE(p.description, '') ILIKE '%seed %'
    OR COALESCE(p.sku, '') ILIKE 'PERSONA-%'
    OR COALESCE(p.sku, '') ILIKE '%-TEST-%'
    OR COALESCE(p.sku, '') ILIKE 'TEST-%'
    OR EXISTS (
      SELECT 1
      FROM unnest(COALESCE(p.images, ARRAY[]::text[])) AS u(url)
      WHERE u.url ILIKE 'fixture:%'
         OR u.url ILIKE '%amazon.com/%'
         OR (u.url <> '' AND u.url NOT ILIKE 'http://%' AND u.url NOT ILIKE 'https://%')
    )
    -- Extreme outlier without catalog link (likely bad data)
    OR (p.price_cents >= 1000000 AND p.catalog_card_id IS NULL AND cardinality(COALESCE(p.images, ARRAY[]::text[])) = 0)
  );
