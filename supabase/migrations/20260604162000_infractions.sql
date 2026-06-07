-- Infraction reports

DO $$ BEGIN
  CREATE TYPE tcg_judge.infraction_type AS ENUM (
    'slow_play', 'deck_error', 'marked_cards', 'insufficient_shuffling',
    'communication_error', 'game_rule_violation', 'illegal_play', 'illegal_chain',
    'illegal_summon', 'illegal_ride', 'drive_check_error', 'security_error',
    'bounty_error', 'illegal_movement', 'cheating', 'outside_assistance',
    'unsporting_conduct', 'improperly_determining_winner', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tcg_judge.infraction_severity AS ENUM ('minor', 'major', 'severe');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tcg_judge.infraction_category AS ENUM ('procedural', 'gameplay', 'ethical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tcg_judge.infraction_status AS ENUM (
    'open', 'investigating', 'resolved', 'appealed', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tcg_judge.infraction_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES tcg_judge.matches(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tcg_judge.tournaments(id) ON DELETE SET NULL,
  reported_by TEXT NOT NULL REFERENCES tcg_judge.judge_profiles(id),
  reported_by_seat INTEGER NOT NULL CHECK (reported_by_seat IN (1, 2)),
  target_player TEXT REFERENCES tcg_judge.judge_profiles(id),
  target_player_seat INTEGER CHECK (target_player_seat IN (1, 2)),
  type tcg_judge.infraction_type NOT NULL,
  severity tcg_judge.infraction_severity NOT NULL,
  category tcg_judge.infraction_category NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  status tcg_judge.infraction_status NOT NULL DEFAULT 'open',
  assigned_judge TEXT REFERENCES tcg_judge.judge_profiles(id),
  resolution JSONB,
  appeal JSONB,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_infractions_match ON tcg_judge.infraction_reports(match_id);
CREATE INDEX IF NOT EXISTS idx_infractions_status ON tcg_judge.infraction_reports(status);
CREATE INDEX IF NOT EXISTS idx_infractions_judge ON tcg_judge.infraction_reports(assigned_judge, status);
CREATE INDEX IF NOT EXISTS idx_infractions_sla ON tcg_judge.infraction_reports(sla_deadline)
  WHERE status IN ('open', 'investigating');

ALTER TABLE tcg_judge.infraction_reports ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS infractions_updated_at ON tcg_judge.infraction_reports;
CREATE TRIGGER infractions_updated_at
  BEFORE UPDATE ON tcg_judge.infraction_reports
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.update_updated_at_column();
