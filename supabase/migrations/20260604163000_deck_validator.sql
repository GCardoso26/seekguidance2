-- Decklists e banlists

CREATE TABLE IF NOT EXISTS tcg_judge.decklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tcg TEXT NOT NULL,
  format TEXT NOT NULL,
  name TEXT NOT NULL,
  player_id TEXT NOT NULL REFERENCES tcg_judge.judge_profiles(id),
  main_deck JSONB NOT NULL,
  sideboard JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra_deck JSONB NOT NULL DEFAULT '[]'::jsonb,
  validated_at TIMESTAMPTZ,
  validation_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tcg_judge.banlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tcg TEXT NOT NULL,
  format TEXT NOT NULL,
  version TEXT NOT NULL,
  effective_from DATE NOT NULL,
  effective_until DATE,
  cards JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT REFERENCES tcg_judge.judge_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tcg, format, version)
);

CREATE INDEX IF NOT EXISTS idx_decklists_player ON tcg_judge.decklists(player_id);
CREATE INDEX IF NOT EXISTS idx_decklists_tcg_format ON tcg_judge.decklists(tcg, format);
CREATE INDEX IF NOT EXISTS idx_banlists_tcg_format ON tcg_judge.banlists(tcg, format, effective_from);

DROP TRIGGER IF EXISTS decklists_updated_at ON tcg_judge.decklists;
CREATE TRIGGER decklists_updated_at
  BEFORE UPDATE ON tcg_judge.decklists
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.update_updated_at_column();
