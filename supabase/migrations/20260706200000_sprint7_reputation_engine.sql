-- Sprint 7: Reputation Engine V2 — aggregates Reputation, SellerScore
SET search_path TO tcg_judge, public;

-- Pesos configuráveis (reputation.md BR-004 — nunca hardcoded)
CREATE TABLE IF NOT EXISTS reputation_signal_weights (
  signal_key TEXT PRIMARY KEY,
  weight NUMERIC(6, 4) NOT NULL CHECK (weight >= 0 AND weight <= 1),
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO reputation_signal_weights (signal_key, weight, description) VALUES
  ('sales', 0.2500, 'Volume e conclusão de pedidos'),
  ('delivery', 0.3000, 'SLA fulfillment e postagem'),
  ('quality', 0.1500, 'Reviews — peso parcial (BR-002)'),
  ('compliance', 0.3000, 'Chargebacks, disputas, refunds')
ON CONFLICT (signal_key) DO NOTHING;

-- Aggregate Reputation (WF-009)
CREATE TABLE IF NOT EXISTS reputations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL DEFAULT 'store' CHECK (entity_type IN ('store', 'buyer')),
  status TEXT NOT NULL DEFAULT 'Updated'
    CHECK (status IN ('Calculating', 'Updated', 'Frozen', 'Rebuilding', 'Invalid')),
  trust_score NUMERIC(5, 2) NOT NULL DEFAULT 75.00
    CHECK (trust_score >= 0 AND trust_score <= 100),
  version INT NOT NULL DEFAULT 1,
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  frozen_reason TEXT,
  last_calculated_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputations_status ON reputations(status);
CREATE INDEX IF NOT EXISTS idx_reputations_trust ON reputations(trust_score DESC);

-- Projection SellerScore
CREATE TABLE IF NOT EXISTS seller_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  reputation_id UUID NOT NULL REFERENCES reputations(id) ON DELETE CASCADE,
  trust_score NUMERIC(5, 2) NOT NULL DEFAULT 75.00,
  seller_level TEXT NOT NULL DEFAULT 'new'
    CHECK (seller_level IN ('new', 'bronze', 'silver', 'gold', 'platinum')),
  sales_score NUMERIC(5, 2) NOT NULL DEFAULT 75.00,
  delivery_score NUMERIC(5, 2) NOT NULL DEFAULT 75.00,
  quality_score NUMERIC(5, 2) NOT NULL DEFAULT 75.00,
  compliance_score NUMERIC(5, 2) NOT NULL DEFAULT 75.00,
  fraud_penalty NUMERIC(5, 2) NOT NULL DEFAULT 0,
  refund_penalty NUMERIC(5, 2) NOT NULL DEFAULT 0,
  dispute_penalty NUMERIC(5, 2) NOT NULL DEFAULT 0,
  orders_completed INT NOT NULL DEFAULT 0,
  orders_cancelled INT NOT NULL DEFAULT 0,
  chargebacks_open INT NOT NULL DEFAULT 0,
  sla_violations INT NOT NULL DEFAULT 0,
  review_avg NUMERIC(3, 2),
  review_count INT NOT NULL DEFAULT 0,
  signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  badges TEXT[] NOT NULL DEFAULT '{}',
  anti_fraud_flags TEXT[] NOT NULL DEFAULT '{}',
  version INT NOT NULL DEFAULT 1,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_scores_level ON seller_scores(seller_level, trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_seller_scores_trust ON seller_scores(trust_score DESC);

-- Idempotência de eventos consumidos (BR-005)
CREATE TABLE IF NOT EXISTS reputation_signal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source_aggregate TEXT,
  source_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlation_id UUID,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputation_signal_events_store
  ON reputation_signal_events(store_id, processed_at DESC);

-- Histórico versionado (BR-010)
CREATE TABLE IF NOT EXISTS reputation_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  from_score NUMERIC(5, 2),
  to_score NUMERIC(5, 2) NOT NULL,
  from_level TEXT,
  to_level TEXT NOT NULL,
  event_type TEXT,
  signals_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INT NOT NULL,
  correlation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputation_history_store
  ON reputation_score_history(store_id, created_at DESC);

-- Projeção pública para marketplace / trust badges
CREATE OR REPLACE VIEW store_reputation_projection AS
SELECT
  s.id AS store_id,
  s.slug AS store_slug,
  s.name AS store_name,
  COALESCE(ss.trust_score, r.trust_score, 75.00)::numeric(5,2) AS trust_score,
  COALESCE(ss.seller_level, 'new') AS seller_level,
  COALESCE(ss.badges, ARRAY[]::text[]) AS badges,
  COALESCE(ss.orders_completed, 0) AS orders_completed,
  COALESCE(ss.review_avg, s.average_rating, 0)::numeric(3,2) AS review_avg,
  COALESCE(ss.review_count, s.review_count, 0) AS review_count,
  COALESCE(ss.sla_violations, 0) AS sla_violations,
  COALESCE(ss.chargebacks_open, 0) AS chargebacks_open,
  COALESCE(ss.anti_fraud_flags, ARRAY[]::text[]) AS anti_fraud_flags,
  r.status AS reputation_status,
  ss.calculated_at
FROM stores s
LEFT JOIN reputations r ON r.store_id = s.id
LEFT JOIN seller_scores ss ON ss.store_id = s.id;

COMMENT ON TABLE reputations IS 'Reputation aggregate root — WF-009 Sprint 7';
COMMENT ON TABLE seller_scores IS 'SellerScore projection — derivada de eventos reais';
