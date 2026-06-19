-- Expo push tokens para app nativo (iOS/Android)
SET search_path TO tcg_judge, public;

CREATE TABLE IF NOT EXISTS user_push_tokens (
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user ON user_push_tokens(user_id);

ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own expo push tokens" ON user_push_tokens;
CREATE POLICY "Users manage own expo push tokens"
  ON user_push_tokens FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
