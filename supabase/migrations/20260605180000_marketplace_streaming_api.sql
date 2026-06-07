-- Fase 5: Lojas, marketplace, reviews, API pública, patrocínios

SET search_path TO tcg_judge, public;

-- Lojas verificadas
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  address TEXT,
  city VARCHAR(80),
  state VARCHAR(50),
  country VARCHAR(2) DEFAULT 'BR',
  lat NUMERIC(10, 8),
  lng NUMERIC(11, 8),
  phone VARCHAR(30),
  email VARCHAR(120),
  website TEXT,
  discord TEXT,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  verified_by TEXT REFERENCES player_profiles(id),
  verification_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  subscription_plan VARCHAR(20) NOT NULL DEFAULT 'free'
    CHECK (subscription_plan IN ('free', 'pro', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ,
  average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  total_tournaments INT NOT NULL DEFAULT 0,
  total_participants INT NOT NULL DEFAULT 0,
  featured_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(LOWER(slug));
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city, country);
CREATE INDEX IF NOT EXISTS idx_stores_rating ON stores(average_rating DESC);

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS store_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL,
  amount_cents INT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS store_followers (
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (store_id, player_id)
);

-- Marketplace decklists
CREATE TABLE IF NOT EXISTS marketplace_decklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  game_code VARCHAR(10) NOT NULL,
  format VARCHAR(30) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  decklist_data JSONB NOT NULL,
  price_cents INT NOT NULL CHECK (price_cents BETWEEN 500 AND 5000),
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'sold', 'withdrawn')),
  sales_count INT NOT NULL DEFAULT 0,
  average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_decklists_search
  ON marketplace_decklists(game_code, format, status, average_rating DESC);

CREATE TABLE IF NOT EXISTS decklist_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decklist_id UUID NOT NULL REFERENCES marketplace_decklists(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  price_cents INT NOT NULL,
  platform_fee_cents INT NOT NULL,
  seller_receives_cents INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (decklist_id, buyer_id)
);

-- Reviews universais
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL
    CHECK (target_type IN ('tournament', 'store', 'organizer', 'decklist')),
  target_id TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  comment TEXT,
  categories JSONB NOT NULL DEFAULT '{}'::jsonb,
  helpful_count INT NOT NULL DEFAULT 0,
  reported BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reviewer_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);

-- API keys (developer portal)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  key_hash VARCHAR(128) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'enterprise')),
  rate_limit_monthly INT NOT NULL DEFAULT 10000,
  usage_count INT NOT NULL DEFAULT 0,
  usage_month VARCHAR(7) NOT NULL DEFAULT to_char(NOW(), 'YYYY-MM'),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret VARCHAR(100) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  last_delivery_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patrocínios
CREATE TABLE IF NOT EXISTS sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS básico
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_decklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stores public read" ON stores;
CREATE POLICY "Stores public read" ON stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners update" ON stores;
CREATE POLICY "Store owners update" ON stores FOR UPDATE USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Store owners insert" ON stores;
CREATE POLICY "Store owners insert" ON stores FOR INSERT WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Marketplace public read" ON marketplace_decklists;
CREATE POLICY "Marketplace public read" ON marketplace_decklists FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Sellers manage decklists" ON marketplace_decklists;
CREATE POLICY "Sellers manage decklists" ON marketplace_decklists FOR ALL
  USING (seller_id = auth.uid()::text) WITH CHECK (seller_id = auth.uid()::text);

DROP POLICY IF EXISTS "Reviews public read" ON reviews;
CREATE POLICY "Reviews public read" ON reviews FOR SELECT USING (NOT reported);

DROP POLICY IF EXISTS "Users create reviews" ON reviews;
CREATE POLICY "Users create reviews" ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid()::text);
