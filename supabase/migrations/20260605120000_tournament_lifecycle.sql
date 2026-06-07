-- Fase 2: ciclo de vida operacional de torneios (participants, rounds, pairings, brackets)

SET search_path TO tcg_judge, public;

-- Expandir estados do torneio
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS phase VARCHAR(30) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS current_round INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_swiss_rounds INT;

ALTER TABLE tournaments
  ADD CONSTRAINT tournaments_status_check CHECK (
    status IN (
      'draft', 'published', 'registration_open', 'check_in',
      'in_progress', 'between_rounds', 'swiss_complete',
      'bracket_active', 'finalized', 'cancelled',
      'open', 'completed'
    )
  );

-- Participantes
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES judge_profiles(id),
  display_name TEXT,
  decklist_id UUID REFERENCES decklists(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'checked_in', 'active', 'dropped', 'disqualified')),
  match_points INT NOT NULL DEFAULT 0,
  match_wins INT NOT NULL DEFAULT 0,
  match_losses INT NOT NULL DEFAULT 0,
  match_draws INT NOT NULL DEFAULT 0,
  game_wins INT NOT NULL DEFAULT 0,
  game_losses INT NOT NULL DEFAULT 0,
  game_draws INT NOT NULL DEFAULT 0,
  omw_percent NUMERIC(8, 3) NOT NULL DEFAULT 0,
  gw_percent NUMERIC(8, 3) NOT NULL DEFAULT 0,
  ogw_percent NUMERIC(8, 3) NOT NULL DEFAULT 0,
  had_bye BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  dropped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament
  ON tournament_participants(tournament_id, status);

-- Rodadas
CREATE TABLE IF NOT EXISTS tournament_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  timer_duration_seconds INT NOT NULL DEFAULT 3300,
  timer_extensions_seconds INT NOT NULL DEFAULT 0,
  timer_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (timer_status IN ('pending', 'running', 'paused', 'extended', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, round_number)
);

-- Pairings
CREATE TABLE IF NOT EXISTS pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES tournament_rounds(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  table_number INT NOT NULL,
  player1_id UUID NOT NULL REFERENCES tournament_participants(id),
  player2_id UUID REFERENCES tournament_participants(id),
  player1_wins INT NOT NULL DEFAULT 0,
  player2_wins INT NOT NULL DEFAULT 0,
  draws INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reported', 'confirmed', 'disputed')),
  reported_by UUID REFERENCES tournament_participants(id),
  confirmed_by UUID REFERENCES tournament_participants(id),
  is_bye BOOLEAN NOT NULL DEFAULT false,
  is_forced_rematch BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pairings_round ON pairings(round_id, table_number);
CREATE INDEX IF NOT EXISTS idx_pairings_tournament ON pairings(tournament_id);

-- Brackets (Top Cut)
CREATE TABLE IF NOT EXISTS brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  format VARCHAR(30) NOT NULL DEFAULT 'SINGLE_ELIMINATION',
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed')),
  top_cut INT NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bracket_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id UUID NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  match_number INT NOT NULL,
  player1_id UUID REFERENCES tournament_participants(id),
  player2_id UUID REFERENCES tournament_participants(id),
  winner_id UUID REFERENCES tournament_participants(id),
  next_match_id UUID REFERENCES bracket_matches(id) ON DELETE SET NULL,
  table_number INT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bracket_matches_bracket ON bracket_matches(bracket_id, round_number);

DROP TRIGGER IF EXISTS tournament_participants_updated_at ON tournament_participants;
CREATE TRIGGER tournament_participants_updated_at
  BEFORE UPDATE ON tournament_participants
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.update_updated_at_column();

DROP TRIGGER IF EXISTS pairings_updated_at ON pairings;
CREATE TRIGGER pairings_updated_at
  BEFORE UPDATE ON pairings
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.update_updated_at_column();
