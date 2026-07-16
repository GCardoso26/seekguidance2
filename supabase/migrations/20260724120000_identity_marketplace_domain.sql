-- Sprint 4.2 — Identity + Marketplace domain persistence
-- New bounded-context schemas. Marketplace references Catalog by ID only (no FK to
-- catalog.* / no FK to search) — ADR-007. Identity ≠ role (SellerProfile is the bridge).

BEGIN;

CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS marketplace;

-- ===========================================================================
-- marketplace (Seller → Inventory → Listing). Order = Sprint 5.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS marketplace.sellers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  text NOT NULL,
  slug          text NOT NULL UNIQUE,
  status        text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended')),
  verification  text NOT NULL DEFAULT 'unverified'
    CHECK (verification IN ('unverified', 'pending', 'verified')),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version   bigint NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Catalog IDs are references, never FKs (bounded-context independence / overlay).
CREATE TABLE IF NOT EXISTS marketplace.inventory_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           uuid NOT NULL REFERENCES marketplace.sellers(id) ON DELETE CASCADE,
  catalog_card_id     uuid NOT NULL,
  catalog_variant_id  uuid NOT NULL,
  quantity            int NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  row_version         bigint NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, catalog_variant_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_seller
  ON marketplace.inventory_items (seller_id);

CREATE TABLE IF NOT EXISTS marketplace.listings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           uuid NOT NULL REFERENCES marketplace.sellers(id) ON DELETE CASCADE,
  catalog_card_id     uuid NOT NULL,
  catalog_variant_id  uuid NOT NULL,
  inventory_item_id   uuid REFERENCES marketplace.inventory_items(id) ON DELETE SET NULL,
  price_cents         bigint NOT NULL CHECK (price_cents >= 0),
  currency            text NOT NULL DEFAULT 'BRL' CHECK (currency IN ('BRL')),
  condition           text NOT NULL,
  language            text NOT NULL,
  notes               text,
  finish              text,
  quantity            int NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  status              text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'sold_out')),
  row_version         bigint NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_catalog_card
  ON marketplace.listings (catalog_card_id);
CREATE INDEX IF NOT EXISTS idx_listings_seller
  ON marketplace.listings (seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_card_active
  ON marketplace.listings (catalog_card_id, price_cents)
  WHERE status = 'active';

COMMENT ON COLUMN marketplace.listings.catalog_card_id IS
  'Catalog reference — never denormalizes official name/oracle/artist (ADR-007).';

-- ===========================================================================
-- identity (User → SellerProfile → Seller). Identity ≠ role.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS identity.users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text NOT NULL UNIQUE,
  display_name   text NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  password_hash  text,
  status         text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  row_version    bigint NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identity.roles (
  name         text PRIMARY KEY,
  description  text,
  permissions  jsonb NOT NULL DEFAULT '[]'::jsonb
);

INSERT INTO identity.roles (name, description, permissions) VALUES
  ('buyer',  'Default role — browse and (Sprint 5) buy', '[]'::jsonb),
  ('seller', 'Granted via SellerProfile',
     '["seller:manage","inventory:write","listing:write","listing:delete"]'::jsonb),
  ('admin',  'Full access', '["admin:all"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS identity.user_roles (
  user_id     uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  role        text NOT NULL REFERENCES identity.roles(name),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS identity.sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON identity.sessions (user_id);

-- The bridge Identity → Marketplace. seller_id references marketplace by ID only
-- (no cross-context FK) to keep the contexts decoupled.
CREATE TABLE IF NOT EXISTS identity.seller_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE REFERENCES identity.users(id) ON DELETE CASCADE,
  seller_id    uuid NOT NULL UNIQUE,
  row_version  bigint NOT NULL DEFAULT 1,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- FROZEN CONTRACTS (declared, NOT implemented in Sprint 4.2)
--   identity.email_verification_tokens  → register → token → confirm → verified
--   identity.password_reset_tokens      → request → token → reset
-- Tables intentionally omitted until the flow is implemented (Sprint 4.3+).
-- See IDENTITY_DOMAIN.md.
-- ---------------------------------------------------------------------------

COMMIT;
