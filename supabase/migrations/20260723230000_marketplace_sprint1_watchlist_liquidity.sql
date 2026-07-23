-- Sprint 1: Liquidity Watchlist bootstrap (Disney Lorcana beachhead)
-- Idempotent: skips cards already active on marcelo-tcg.
-- Operational evidence: CVC empty staple search + LCS=0 on BETA_COMMAND_CENTER watchlist.

UPDATE tcg_judge.stores
SET is_test = true, updated_at = now()
WHERE slug = 'qa-store-601662' AND COALESCE(is_test, false) = false;

WITH target AS (
  SELECT id AS store_id, owner_id AS seller_id
  FROM tcg_judge.stores
  WHERE slug = 'marcelo-tcg' AND COALESCE(is_test, false) = false
),
cards AS (
  SELECT DISTINCT ON (cc.name)
    cc.id AS card_id,
    cc.name,
    cc.set_name,
    cc.image_url,
    cc.game_code
  FROM tcg_judge.card_catalog cc
  WHERE cc.game_code = 'LORCANA'
    AND cc.image_url ILIKE 'https://%'
    AND cc.name IN (
      'Diablo - Devoted Herald',
      'Be Prepared',
      'A Whole New World',
      'Belle - Strange but special',
      'Rapunzel - Gifted with Healing',
      'Stitch - Rock Star',
      'Elsa - Spirit of Winter',
      'Hiram Flaversham - Toymaker',
      'Maui - Hero to All',
      'Beast - Tragic Hero',
      'Sisu - Empowered Sibling'
    )
  ORDER BY cc.name,
    CASE WHEN cc.set_name = 'The First Chapter' THEN 0 ELSE 1 END,
    cc.created_at NULLS LAST
),
priced AS (
  SELECT c.*,
    CASE c.name
      WHEN 'Rapunzel - Gifted with Healing' THEN 18900
      WHEN 'Elsa - Spirit of Winter' THEN 24900
      WHEN 'Stitch - Rock Star' THEN 9900
      WHEN 'Maui - Hero to All' THEN 7900
      WHEN 'Belle - Strange but special' THEN 6900
      WHEN 'Diablo - Devoted Herald' THEN 4500
      WHEN 'Be Prepared' THEN 3500
      WHEN 'A Whole New World' THEN 4200
      WHEN 'Hiram Flaversham - Toymaker' THEN 2800
      WHEN 'Beast - Tragic Hero' THEN 3200
      WHEN 'Sisu - Empowered Sibling' THEN 3800
      ELSE 2500
    END AS price_cents
  FROM cards c
),
ins_prod AS (
  INSERT INTO tcg_judge.store_products (
    store_id, name, description, tcg_id, category,
    price_cents, stock, images, catalog_card_id, is_active, language
  )
  SELECT
    t.store_id,
    p.name || ' (NM)',
    'Oferta Liquidity Watchlist — ' || COALESCE(p.set_name, 'Lorcana'),
    'LORCANA',
    'single',
    p.price_cents,
    4,
    ARRAY[p.image_url]::text[],
    p.card_id,
    true,
    'en'
  FROM priced p
  CROSS JOIN target t
  WHERE NOT EXISTS (
    SELECT 1 FROM tcg_judge.store_products sp
    WHERE sp.store_id = t.store_id
      AND sp.catalog_card_id = p.card_id
      AND sp.is_active = true
  )
  RETURNING id, store_id, catalog_card_id, price_cents, stock, images, name
)
INSERT INTO tcg_judge.card_listings (
  card_id, seller_id, store_id, store_product_id,
  condition, price_cents, currency, quantity, foil, language,
  images, description, status
)
SELECT
  ip.catalog_card_id,
  t.seller_id,
  ip.store_id,
  ip.id,
  'NM',
  ip.price_cents,
  'BRL',
  ip.stock,
  false,
  'en',
  ip.images,
  ip.name,
  'active'
FROM ins_prod ip
CROSS JOIN target t
WHERE NOT EXISTS (
  SELECT 1 FROM tcg_judge.card_listings cl
  WHERE cl.store_product_id = ip.id AND cl.status = 'active'
);
