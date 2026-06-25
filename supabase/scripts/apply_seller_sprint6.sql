-- Sprint 6 hotfix: payment_method escrow_buylist (opcional; código usa escrow_pix)
ALTER TABLE tcg_judge.shop_orders DROP CONSTRAINT IF EXISTS shop_orders_payment_method_check;
ALTER TABLE tcg_judge.shop_orders ADD CONSTRAINT shop_orders_payment_method_check
  CHECK (payment_method IN ('pix', 'stripe', 'escrow_pix', 'escrow_stripe', 'escrow_buylist'));
