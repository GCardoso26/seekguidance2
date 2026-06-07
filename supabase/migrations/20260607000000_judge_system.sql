-- Sprint 3: Painel Juiz Digital — certificações, chamadas, infrações, fair play

SET search_path TO tcg_judge, public;

-- Certificações de juiz por jogo
CREATE TABLE IF NOT EXISTS judge_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL REFERENCES judge_profiles(id) ON DELETE CASCADE,
  game_code VARCHAR(10) NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('level1', 'level2', 'level3')),
  certified_by TEXT REFERENCES judge_profiles(id) ON DELETE SET NULL,
  certified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'expired')),
  UNIQUE (player_id, game_code)
);

CREATE INDEX IF NOT EXISTS idx_judge_certifications_player
  ON judge_certifications(player_id, status);

-- Chamadas de juiz em torneios
CREATE TABLE IF NOT EXISTS judge_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_id UUID REFERENCES tournament_rounds(id) ON DELETE SET NULL,
  table_number INT NOT NULL,

  caller_id TEXT REFERENCES judge_profiles(id) ON DELETE SET NULL,
  caller_participant_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,

  type VARCHAR(50) NOT NULL CHECK (type IN (
    'rules_question', 'dispute', 'cheating_suspicion',
    'slow_play', 'unsporting_conduct', 'deck_error', 'other'
  )),

  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'assigned', 'resolved', 'escalated', 'dismissed')),

  assigned_judge_id TEXT REFERENCES judge_profiles(id) ON DELETE SET NULL,

  description TEXT NOT NULL,
  evidence_urls TEXT[] NOT NULL DEFAULT '{}',

  ruling TEXT,
  ruling_category VARCHAR(50) CHECK (ruling_category IN (
    'warning', 'game_loss', 'match_loss', 'disqualification',
    'none', 'rule_clarification'
  )),
  ruling_judge_id TEXT REFERENCES judge_profiles(id) ON DELETE SET NULL,

  escalated_to TEXT REFERENCES judge_profiles(id) ON DELETE SET NULL,
  escalation_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_judge_calls_tournament
  ON judge_calls(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_judge_calls_assigned
  ON judge_calls(assigned_judge_id, status);
CREATE INDEX IF NOT EXISTS idx_judge_calls_priority
  ON judge_calls(priority, created_at);

-- Penalidades aplicadas via chamadas de juiz
CREATE TABLE IF NOT EXISTS call_infractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES judge_calls(id) ON DELETE CASCADE,

  player_id TEXT NOT NULL REFERENCES judge_profiles(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,

  type VARCHAR(50) NOT NULL CHECK (type IN (
    'slow_play', 'deck_error', 'unsporting_conduct_minor',
    'unsporting_conduct_major', 'cheating'
  )),

  severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'major', 'severe')),

  penalty VARCHAR(20) NOT NULL CHECK (penalty IN (
    'warning', 'game_loss', 'match_loss', 'disqualification'
  )),

  description TEXT,
  judge_id TEXT REFERENCES judge_profiles(id) ON DELETE SET NULL,

  appealable BOOLEAN NOT NULL DEFAULT true,
  appealed BOOLEAN NOT NULL DEFAULT false,
  appeal_ruling TEXT,
  appeal_judge_id TEXT REFERENCES judge_profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_call_infractions_player
  ON call_infractions(player_id, tournament_id);

-- Fair play score por jogador/jogo
CREATE TABLE IF NOT EXISTS fair_play_scores (
  player_id TEXT NOT NULL REFERENCES judge_profiles(id) ON DELETE CASCADE,
  game_code VARCHAR(10) NOT NULL,

  score NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (score >= 0 AND score <= 5),
  total_infractions INT NOT NULL DEFAULT 0,
  total_warnings INT NOT NULL DEFAULT 0,
  total_game_losses INT NOT NULL DEFAULT 0,
  total_match_losses INT NOT NULL DEFAULT 0,
  total_dqs INT NOT NULL DEFAULT 0,

  last_infraction_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (player_id, game_code)
);

ALTER TABLE judge_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_infractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fair_play_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY judge_certs_select ON judge_certifications
  FOR SELECT USING (true);

CREATE POLICY judge_calls_select ON judge_calls
  FOR SELECT USING (
    caller_id = auth.uid()::text
    OR assigned_judge_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id AND t.created_by = auth.uid()::text
    )
  );

CREATE POLICY call_infractions_select ON call_infractions
  FOR SELECT USING (
    player_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM judge_calls c
      WHERE c.id = call_id AND c.assigned_judge_id = auth.uid()::text
    )
  );

CREATE POLICY fair_play_scores_select ON fair_play_scores
  FOR SELECT USING (player_id = auth.uid()::text OR true);
