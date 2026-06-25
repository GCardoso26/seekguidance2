-- Sprint 2: integração escrow no checkout

SET search_path TO tcg_judge, public;

ALTER TABLE shop_orders
  ADD COLUMN IF NOT EXISTS use_escrow BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE shop_orders DROP CONSTRAINT IF EXISTS shop_orders_payment_method_check;
ALTER TABLE shop_orders ADD CONSTRAINT shop_orders_payment_method_check
  CHECK (payment_method IN ('pix', 'stripe', 'escrow_pix', 'escrow_stripe'));

COMMENT ON COLUMN shop_orders.use_escrow IS 'Compra protegida — fundos retidos até confirmação';
