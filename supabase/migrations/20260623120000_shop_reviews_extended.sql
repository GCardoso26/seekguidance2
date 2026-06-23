-- Estende shop_reviews (não cria seller_reviews paralela)

SET search_path TO tcg_judge, public;

ALTER TABLE tcg_judge.shop_reviews
  ADD COLUMN IF NOT EXISTS item_as_described BOOLEAN,
  ADD COLUMN IF NOT EXISTS shipping_speed INT CHECK (shipping_speed IS NULL OR (shipping_speed >= 1 AND shipping_speed <= 5)),
  ADD COLUMN IF NOT EXISTS communication INT CHECK (communication IS NULL OR (communication >= 1 AND communication <= 5)),
  ADD COLUMN IF NOT EXISTS recommend BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_shop_reviews_rating
  ON tcg_judge.shop_reviews(store_id, rating)
  WHERE is_visible = TRUE;
