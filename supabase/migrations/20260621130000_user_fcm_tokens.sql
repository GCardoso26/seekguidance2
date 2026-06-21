-- Tokens FCM (Firebase Cloud Messaging) para push web/mobile nativo
SET search_path TO tcg_judge, public;

CREATE TABLE IF NOT EXISTS user_fcm_tokens (
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user ON user_fcm_tokens(user_id);

ALTER TABLE user_fcm_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own fcm tokens" ON user_fcm_tokens;
CREATE POLICY "Users manage own fcm tokens"
  ON user_fcm_tokens FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
