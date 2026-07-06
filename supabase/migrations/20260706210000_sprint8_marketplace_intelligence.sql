-- Sprint 8: Marketplace Intelligence — read models analíticos orientados a eventos
SET search_path TO tcg_judge, public;

-- Cursor de projeção / idempotência rebuild
CREATE TABLE IF NOT EXISTS analytics_projection_cursors (
  projection_key TEXT PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  last_event_id TEXT,
  last_rebuilt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rows_affected INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_analytics_cursors_store
  ON analytics_projection_cursors(store_id) WHERE store_id IS NOT NULL;

-- Vendas diárias agregadas
CREATE TABLE IF NOT EXISTS analytics_daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  orders_count INT NOT NULL DEFAULT 0,
  units_sold INT NOT NULL DEFAULT 0,
  revenue_cents BIGINT NOT NULL DEFAULT 0,
  unique_buyers INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, sale_date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_sales_store_date
  ON analytics_daily_sales(store_id, sale_date DESC);

-- Performance de listings
CREATE TABLE IF NOT EXISTS analytics_listing_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES card_listings(id) ON DELETE SET NULL,
  card_id UUID,
  card_name TEXT,
  listing_status TEXT,
  price_cents INT NOT NULL DEFAULT 0,
  quantity_available INT NOT NULL DEFAULT 0,
  sales_count INT NOT NULL DEFAULT 0,
  units_sold INT NOT NULL DEFAULT 0,
  revenue_cents BIGINT NOT NULL DEFAULT 0,
  views_proxy INT NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(6, 4) NOT NULL DEFAULT 0,
  days_since_listed INT,
  last_sold_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_listing_perf_store
  ON analytics_listing_performance(store_id, sales_count DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_listing_perf_revenue
  ON analytics_listing_performance(store_id, revenue_cents DESC);

-- Pricing intelligence snapshots
CREATE TABLE IF NOT EXISTS analytics_pricing_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES card_listings(id) ON DELETE CASCADE,
  card_id UUID NOT NULL,
  listing_price_cents INT NOT NULL,
  market_median_cents INT,
  catalog_price_cents INT,
  suggested_price_cents INT,
  delta_pct NUMERIC(6, 2),
  suggestion TEXT NOT NULL DEFAULT 'hold'
    CHECK (suggestion IN ('lower', 'hold', 'raise')),
  confidence NUMERIC(4, 3) NOT NULL DEFAULT 0.5,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_pricing_store
  ON analytics_pricing_snapshots(store_id, calculated_at DESC);

-- Churn score por comprador recorrente
CREATE TABLE IF NOT EXISTS analytics_churn_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL,
  order_count INT NOT NULL DEFAULT 0,
  total_spent_cents BIGINT NOT NULL DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  days_since_last_order INT,
  churn_score NUMERIC(5, 2) NOT NULL DEFAULT 0
    CHECK (churn_score >= 0 AND churn_score <= 100),
  risk_level TEXT NOT NULL DEFAULT 'low'
    CHECK (risk_level IN ('low', 'medium', 'high')),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_churn_store_risk
  ON analytics_churn_scores(store_id, risk_level, churn_score DESC);

-- View consolidada seller intelligence
CREATE OR REPLACE VIEW seller_intelligence_projection AS
SELECT
  s.id AS store_id,
  s.name AS store_name,
  COALESCE(ds.orders_30d, 0) AS orders_30d,
  COALESCE(ds.revenue_30d, 0) AS revenue_30d_cents,
  COALESCE(lp.active_listings, 0) AS active_listings,
  COALESCE(lp.total_listing_sales, 0) AS listing_sales_30d,
  COALESCE(ch.at_risk_buyers, 0) AS at_risk_buyers,
  COALESCE(pr.pricing_opportunities, 0) AS pricing_opportunities
FROM stores s
LEFT JOIN LATERAL (
  SELECT
    SUM(orders_count)::int AS orders_30d,
    SUM(revenue_cents)::bigint AS revenue_30d
  FROM analytics_daily_sales ads
  WHERE ads.store_id = s.id
    AND ads.sale_date >= CURRENT_DATE - INTERVAL '30 days'
) ds ON TRUE
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE listing_status = 'active')::int AS active_listings,
    COALESCE(SUM(sales_count), 0)::int AS total_listing_sales
  FROM analytics_listing_performance alp
  WHERE alp.store_id = s.id
) lp ON TRUE
LEFT JOIN LATERAL (
  SELECT COUNT(*) FILTER (WHERE risk_level IN ('medium', 'high'))::int AS at_risk_buyers
  FROM analytics_churn_scores acs
  WHERE acs.store_id = s.id
) ch ON TRUE
LEFT JOIN LATERAL (
  SELECT COUNT(*) FILTER (WHERE suggestion != 'hold')::int AS pricing_opportunities
  FROM analytics_pricing_snapshots aps
  WHERE aps.store_id = s.id
) pr ON TRUE;

COMMENT ON TABLE analytics_daily_sales IS 'Read model — vendas diárias Sprint 8';
COMMENT ON TABLE analytics_listing_performance IS 'Read model — performance listings Sprint 8';
