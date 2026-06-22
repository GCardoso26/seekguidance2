-- Fase 1.5: Liga Pass — XP, níveis e benefícios

SET search_path TO tcg_judge, public;

DO $$ BEGIN
  CREATE TYPE tcg_judge.user_level AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'judge');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS level_benefits (
  level tcg_judge.user_level PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  min_xp INTEGER NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  cashback_percent DECIMAL(5, 2) DEFAULT 0,
  free_shipping_threshold INTEGER,
  max_alerts INTEGER DEFAULT 10
);

INSERT INTO level_benefits (level, name, min_xp, color_hex, cashback_percent, free_shipping_threshold, max_alerts)
VALUES
  ('bronze', 'Bronze', 0, '#CD7F32', 0, NULL, 10),
  ('silver', 'Prata', 1000, '#C0C0C0', 1, 20000, 25),
  ('gold', 'Ouro', 5000, '#FFD700', 2, 15000, 50),
  ('platinum', 'Platina', 15000, '#E5E4E2', 3, 10000, 100),
  ('judge', 'Juiz', 30000, '#8B0000', 5, 0, 999)
ON CONFLICT (level) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level tcg_judge.user_level NOT NULL DEFAULT 'bronze',
  total_purchases INTEGER NOT NULL DEFAULT 0,
  total_sales INTEGER NOT NULL DEFAULT 0,
  decks_created INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  xp_earned INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_xp_user ON user_xp(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_total ON user_xp(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);

ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_xp_select_own ON user_xp;
CREATE POLICY user_xp_select_own ON user_xp
  FOR SELECT USING (user_id = current_setting('request.jwt.claim.sub', true));

DROP POLICY IF EXISTS xp_transactions_select_own ON xp_transactions;
CREATE POLICY xp_transactions_select_own ON xp_transactions
  FOR SELECT USING (user_id = current_setting('request.jwt.claim.sub', true));

CREATE OR REPLACE FUNCTION tcg_judge.calculate_level(total_xp INTEGER)
RETURNS tcg_judge.user_level AS $$
BEGIN
  IF total_xp >= 30000 THEN RETURN 'judge';
  ELSIF total_xp >= 15000 THEN RETURN 'platinum';
  ELSIF total_xp >= 5000 THEN RETURN 'gold';
  ELSIF total_xp >= 1000 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION tcg_judge.update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_level = tcg_judge.calculate_level(NEW.total_xp);
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_level ON user_xp;
CREATE TRIGGER trigger_update_user_level
  BEFORE INSERT OR UPDATE ON user_xp
  FOR EACH ROW
  EXECUTE FUNCTION tcg_judge.update_user_level();

COMMENT ON TABLE user_xp IS 'XP acumulado e nível Liga Pass por jogador';
COMMENT ON TABLE xp_transactions IS 'Histórico de XP ganho por ação';
COMMENT ON TABLE level_benefits IS 'Benefícios por nível Liga Pass';

-- DOWN (rollback manual):
-- DROP TRIGGER IF EXISTS trigger_update_user_level ON user_xp;
-- DROP FUNCTION IF EXISTS tcg_judge.update_user_level();
-- DROP FUNCTION IF EXISTS tcg_judge.calculate_level(INTEGER);
-- DROP TABLE IF EXISTS xp_transactions;
-- DROP TABLE IF EXISTS user_xp;
-- DROP TABLE IF EXISTS level_benefits;
-- DROP TYPE IF EXISTS tcg_judge.user_level;
