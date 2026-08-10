-- Event tickets as store_products + counter checkout (24h hold)

ALTER TABLE tcg_judge.store_products
  DROP CONSTRAINT IF EXISTS store_products_category_check;

ALTER TABLE tcg_judge.store_products
  ADD CONSTRAINT store_products_category_check
  CHECK (
    (category)::text = ANY (
      (ARRAY[
        'booster'::character varying,
        'sleeve'::character varying,
        'deck_box'::character varying,
        'playmat'::character varying,
        'accessory'::character varying,
        'single'::character varying,
        'event'::character varying
      ])::text[]
    )
  );

ALTER TABLE tcg_judge.store_products
  DROP CONSTRAINT IF EXISTS store_products_price_cents_check;

ALTER TABLE tcg_judge.store_products
  ADD CONSTRAINT store_products_price_cents_check
  CHECK (price_cents >= 0);

ALTER TABLE tcg_judge.shop_orders
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NULL;

ALTER TABLE tcg_judge.shop_orders
  DROP CONSTRAINT IF EXISTS shop_orders_payment_method_check;

ALTER TABLE tcg_judge.shop_orders
  ADD CONSTRAINT shop_orders_payment_method_check
  CHECK (
    payment_method = ANY (
      ARRAY[
        'pix'::text,
        'stripe'::text,
        'escrow_pix'::text,
        'escrow_stripe'::text,
        'counter'::text
      ]
    )
  );

ALTER TABLE tcg_judge.shop_orders
  DROP CONSTRAINT IF EXISTS shop_orders_status_check;

ALTER TABLE tcg_judge.shop_orders
  ADD CONSTRAINT shop_orders_status_check
  CHECK (
    (status)::text = ANY (
      (ARRAY[
        'pending'::character varying,
        'paid'::character varying,
        'processing'::character varying,
        'shipped'::character varying,
        'delivered'::character varying,
        'cancelled'::character varying,
        'disputed'::character varying,
        'refunded'::character varying,
        'awaiting_counter_payment'::character varying,
        'expired'::character varying
      ])::text[]
    )
  );

ALTER TABLE tcg_judge.shop_orders
  DROP CONSTRAINT IF EXISTS shop_orders_total_cents_check;

ALTER TABLE tcg_judge.shop_orders
  ADD CONSTRAINT shop_orders_total_cents_check
  CHECK (total_cents >= 0);

CREATE INDEX IF NOT EXISTS idx_shop_orders_counter_expire
  ON tcg_judge.shop_orders (expires_at)
  WHERE status = 'awaiting_counter_payment' AND payment_method = 'counter';

CREATE OR REPLACE FUNCTION tcg_judge.expire_counter_orders()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  n integer := 0;
  r record;
BEGIN
  FOR r IN
    SELECT o.id
    FROM tcg_judge.shop_orders o
    WHERE o.status = 'awaiting_counter_payment'
      AND o.payment_method = 'counter'
      AND o.expires_at IS NOT NULL
      AND o.expires_at < NOW()
    FOR UPDATE OF o SKIP LOCKED
  LOOP
    UPDATE tcg_judge.store_products p
    SET reserved_stock = GREATEST(p.reserved_stock - i.quantity, 0),
        updated_at = NOW()
    FROM tcg_judge.shop_order_items i
    WHERE i.order_id = r.id
      AND p.id = i.product_id;

    UPDATE tcg_judge.event_tickets t
    SET availability = GREATEST(
          COALESCE(
            (SELECT p.stock - COALESCE(p.reserved_stock, 0)
             FROM tcg_judge.store_products p
             WHERE p.id = t.store_product_id),
            t.availability
          ),
          0
        ),
        updated_at = NOW()
    WHERE t.store_product_id IN (
      SELECT i.product_id FROM tcg_judge.shop_order_items i WHERE i.order_id = r.id
    );

    UPDATE tcg_judge.shop_orders
    SET status = 'expired', updated_at = NOW()
    WHERE id = r.id;

    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;
