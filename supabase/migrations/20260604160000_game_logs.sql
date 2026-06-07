-- Game logs com hash chain

CREATE TABLE IF NOT EXISTS tcg_judge.game_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES tcg_judge.matches(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  timestamp BIGINT NOT NULL,
  actor JSONB NOT NULL,
  action JSONB NOT NULL,
  game_state_snapshot JSONB NOT NULL,
  previous_hash TEXT NOT NULL,
  hash TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_game_logs_match ON tcg_judge.game_logs(match_id, sequence);
CREATE INDEX IF NOT EXISTS idx_game_logs_action_type ON tcg_judge.game_logs USING GIN((action->'type'));
CREATE INDEX IF NOT EXISTS idx_game_logs_timestamp ON tcg_judge.game_logs(timestamp);

CREATE OR REPLACE FUNCTION tcg_judge.verify_log_chain(p_match_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_prev_hash TEXT := '0';
  v_entry RECORD;
BEGIN
  FOR v_entry IN
    SELECT hash, previous_hash
    FROM tcg_judge.game_logs
    WHERE match_id = p_match_id
    ORDER BY sequence
  LOOP
    IF v_entry.previous_hash != v_prev_hash THEN
      RETURN FALSE;
    END IF;
    v_prev_hash := v_entry.hash;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
