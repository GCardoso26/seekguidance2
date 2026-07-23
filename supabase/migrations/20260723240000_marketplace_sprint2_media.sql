-- Sprint 2: PDP/media — usable https images for sealed + accessories
-- Idempotent operational remediation (already applied on prod 2026-07-23).

-- Drop non-routable demo CDN URLs from media assets.
UPDATE media.assets
SET cdn_url = NULL
WHERE cdn_url ILIKE '%judgetcg.example%'
   OR cdn_url ILIKE '%.example/%'
   OR cdn_url ILIKE 'https://via.placeholder.com%';

-- Backfill singles with catalog card art when listing image is missing/junk.
UPDATE tcg_judge.store_products p
SET images = ARRAY[cc.image_url]::text[],
    updated_at = now()
FROM tcg_judge.card_catalog cc
WHERE p.catalog_card_id = cc.id
  AND p.is_active = true
  AND cc.image_url ILIKE 'https://%'
  AND (
    p.images IS NULL
    OR cardinality(p.images) = 0
    OR p.images[1] ILIKE 'fixture:%'
    OR p.images[1] ILIKE '%.example%'
    OR p.images[1] ILIKE '%judgetcg.example%'
  );
