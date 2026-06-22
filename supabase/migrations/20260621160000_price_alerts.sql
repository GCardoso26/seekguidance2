-- Fase 1.8: alertas de preço por carta

SET search_path TO tcg_judge, public;

CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES card_catalog(id) ON DELETE CASCADE,

  target_price_cents INT NOT NULL CHECK (target_price_cents > 0),
  price_condition VARCHAR(10) NOT NULL DEFAULT 'below'
    CHECK (price_condition IN ('below', 'above')),
  target_card_condition VARCHAR(10)
    CHECK (target_card_condition IS NULL OR target_card_condition IN ('NM', 'LP', 'MP', 'HP', 'DM')),
  target_foil BOOLEAN,

  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'triggered', 'disabled', 'expired')),

  email_notified BOOLEAN NOT NULL DEFAULT FALSE,
  push_notified BOOLEAN NOT NULL DEFAULT FALSE,
  last_checked_at TIMESTAMPTZ,
  triggered_at TIMESTAMPTZ,

  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_card_id ON price_alerts(card_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_status ON price_alerts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_price_alerts_expires ON price_alerts(expires_at);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY price_alerts_select_own ON price_alerts
  FOR SELECT USING (user_id = current_setting('request.jwt.claim.sub', true));

CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES price_alerts(id) ON DELETE CASCADE,
  notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('email', 'push', 'sms')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  triggered_price_cents INT NOT NULL,
  card_name VARCHAR(300) NOT NULL,
  card_image_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON alert_notifications(alert_id);

COMMENT ON TABLE price_alerts IS 'Alertas de preço de cartas do catálogo';

-- DOWN (rollback manual):
-- DROP TABLE IF EXISTS alert_notifications;
-- DROP TABLE IF EXISTS price_alerts;
