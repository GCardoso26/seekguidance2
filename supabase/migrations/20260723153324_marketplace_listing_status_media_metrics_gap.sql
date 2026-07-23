-- Gap fill: listing timeline/media/metrics missing from partial marketplace_saga apply
CREATE TABLE IF NOT EXISTS marketplace.listing_status (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES marketplace.listings(id) ON DELETE CASCADE,
  from_status  text,
  to_status    text NOT NULL,
  reason       text,
  actor_id     text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_status_listing
  ON marketplace.listing_status (listing_id, created_at DESC);

CREATE TABLE IF NOT EXISTS marketplace.listing_media (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES marketplace.listings(id) ON DELETE CASCADE,
  asset_id     uuid,
  role         text NOT NULL DEFAULT 'primary',
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_media_listing
  ON marketplace.listing_media (listing_id, sort_order);

CREATE TABLE IF NOT EXISTS marketplace.listing_metrics (
  listing_id       uuid PRIMARY KEY REFERENCES marketplace.listings(id) ON DELETE CASCADE,
  views            bigint NOT NULL DEFAULT 0,
  clicks           bigint NOT NULL DEFAULT 0,
  favorites        bigint NOT NULL DEFAULT 0,
  add_to_cart      bigint NOT NULL DEFAULT 0,
  sales            bigint NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace.seller_metrics (
  seller_id        uuid PRIMARY KEY REFERENCES marketplace.sellers(id) ON DELETE CASCADE,
  active_listings  int NOT NULL DEFAULT 0,
  total_sales      bigint NOT NULL DEFAULT 0,
  gmv_cents        bigint NOT NULL DEFAULT 0,
  avg_rating       numeric(4, 2),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
