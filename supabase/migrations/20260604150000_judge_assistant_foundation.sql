-- Fase A: fundação Judge Assistant (perfis, torneios, partidas)

CREATE TABLE IF NOT EXISTS tcg_judge.judge_profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'player'
    CHECK (role IN ('player', 'judge', 'head_judge', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tcg_judge.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tcg TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'standard',
  level TEXT NOT NULL DEFAULT 'regular'
    CHECK (level IN ('casual', 'regular', 'competitive')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
  created_by TEXT REFERENCES tcg_judge.judge_profiles(id),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tcg_judge.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tcg_judge.tournaments(id) ON DELETE SET NULL,
  tcg TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'standard',
  player1_id TEXT NOT NULL REFERENCES tcg_judge.judge_profiles(id),
  player2_id TEXT NOT NULL REFERENCES tcg_judge.judge_profiles(id),
  player1_seat INTEGER NOT NULL DEFAULT 1 CHECK (player1_seat IN (1, 2)),
  player2_seat INTEGER NOT NULL DEFAULT 2 CHECK (player2_seat IN (1, 2)),
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  winner_id TEXT REFERENCES tcg_judge.judge_profiles(id),
  log_schema_version TEXT NOT NULL DEFAULT '1.0.0',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON tcg_judge.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_players ON tcg_judge.matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_tcg ON tcg_judge.tournaments(tcg, status);

CREATE OR REPLACE FUNCTION tcg_judge.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS judge_profiles_updated_at ON tcg_judge.judge_profiles;
CREATE TRIGGER judge_profiles_updated_at
  BEFORE UPDATE ON tcg_judge.judge_profiles
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.update_updated_at_column();

DROP TRIGGER IF EXISTS tournaments_updated_at ON tcg_judge.tournaments;
CREATE TRIGGER tournaments_updated_at
  BEFORE UPDATE ON tcg_judge.tournaments
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.update_updated_at_column();

DROP TRIGGER IF EXISTS matches_updated_at ON tcg_judge.matches;
CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON tcg_judge.matches
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.update_updated_at_column();
