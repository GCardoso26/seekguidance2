-- Checkout Sprint 1: guest carts + coupon rules columns
BEGIN;

ALTER TABLE checkout.carts
  ADD COLUMN IF NOT EXISTS guest_token text,
  ADD COLUMN IF NOT EXISTS merged_into_cart_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS uq_checkout_carts_guest_open
  ON checkout.carts (guest_token)
  WHERE guest_token IS NOT NULL AND status = 'open';

ALTER TABLE checkout.coupons
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'percentage'
    CHECK (kind IN ('fixed', 'percentage', 'free_shipping')),
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'marketplace'
    CHECK (scope IN ('marketplace', 'seller')),
  ADD COLUMN IF NOT EXISTS seller_id uuid,
  ADD COLUMN IF NOT EXISTS min_subtotal_cents int CHECK (min_subtotal_cents IS NULL OR min_subtotal_cents >= 0),
  ADD COLUMN IF NOT EXISTS max_uses int CHECK (max_uses IS NULL OR max_uses > 0),
  ADD COLUMN IF NOT EXISTS used_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS free_shipping boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS game_slugs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rules jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Align seed coupons with kind
UPDATE checkout.coupons SET kind = 'percentage' WHERE percent_off IS NOT NULL AND kind = 'percentage';
UPDATE checkout.coupons SET kind = 'fixed' WHERE amount_off_cents IS NOT NULL;

COMMIT;
