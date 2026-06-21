-- Cupom persistido no pedido PIX

SET search_path TO tcg_judge, public;

ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS subtotal_cents INT;

UPDATE shop_orders
SET subtotal_cents = total_cents + COALESCE(discount_cents, 0)
WHERE subtotal_cents IS NULL;

ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS original_comment TEXT;
ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS edit_count INT NOT NULL DEFAULT 0;
