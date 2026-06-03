-- Monetização v1: eventos de analytics (pricing, paywall, checkout futuro)

CREATE TABLE IF NOT EXISTS tcg_judge.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  user_id UUID,
  anonymous_id TEXT,
  properties JSONB,
  tier TEXT CHECK (tier IN ('free', 'pro', 'team')),
  game_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_event_idx
  ON tcg_judge.analytics_events (event, timestamp DESC);

CREATE INDEX IF NOT EXISTS analytics_user_idx
  ON tcg_judge.analytics_events (user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS analytics_tier_idx
  ON tcg_judge.analytics_events (tier, event);

CREATE INDEX IF NOT EXISTS analytics_anonymous_idx
  ON tcg_judge.analytics_events (anonymous_id, timestamp DESC);

ALTER TABLE tcg_judge.analytics_events ENABLE ROW LEVEL SECURITY;

-- Backend (service role) e inserts anónimos via política restrita
CREATE POLICY analytics_events_insert_anon
  ON tcg_judge.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY analytics_events_select_service
  ON tcg_judge.analytics_events
  FOR SELECT
  TO authenticated
  USING (false);

CREATE OR REPLACE VIEW tcg_judge.v_monetization_metrics AS
SELECT
  DATE_TRUNC('day', timestamp) AS day,
  tier,
  COUNT(DISTINCT COALESCE(user_id::text, anonymous_id)) AS unique_users,
  COUNT(*) AS event_count,
  COUNT(DISTINCT CASE WHEN event = 'checkout_completed' THEN COALESCE(user_id::text, anonymous_id) END) AS conversions
FROM tcg_judge.analytics_events
WHERE event IN (
  'pricing_page_view',
  'paywall_hit',
  'checkout_started',
  'checkout_completed',
  'subscription_cancelled',
  'pricing_cta_click',
  'pricing_start_free'
)
GROUP BY 1, 2;
