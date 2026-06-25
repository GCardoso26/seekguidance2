-- Sprint 5: aplicar no SQL Editor Supabase
SET search_path TO tcg_judge, public;
ALTER TABLE shop_order_items ALTER COLUMN product_id DROP NOT NULL;
