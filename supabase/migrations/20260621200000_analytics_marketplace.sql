-- Analytics marketplace: colunas de contexto + user_id como TEXT

SET search_path TO tcg_judge, public;

ALTER TABLE tcg_judge.analytics_events
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE tcg_judge.analytics_events
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS ip_address INET;

CREATE INDEX IF NOT EXISTS idx_analytics_events_session
  ON tcg_judge.analytics_events (session_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_url
  ON tcg_judge.analytics_events (url)
  WHERE url IS NOT NULL;

COMMENT ON COLUMN tcg_judge.analytics_events.session_id IS 'Sessão anónima ou autenticada do browser';

-- DOWN (rollback manual):
-- ALTER TABLE tcg_judge.analytics_events DROP COLUMN IF EXISTS ip_address;
-- ALTER TABLE tcg_judge.analytics_events DROP COLUMN IF EXISTS user_agent;
-- ALTER TABLE tcg_judge.analytics_events DROP COLUMN IF EXISTS referrer;
-- ALTER TABLE tcg_judge.analytics_events DROP COLUMN IF EXISTS url;
-- ALTER TABLE tcg_judge.analytics_events DROP COLUMN IF EXISTS session_id;
