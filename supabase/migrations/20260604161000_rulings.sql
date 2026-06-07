-- Ruling database

DO $$ BEGIN
  CREATE TYPE tcg_judge.ruling_status AS ENUM (
    'draft', 'pending_review', 'approved', 'disputed', 'deprecated'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tcg_judge.ruling_hierarchy AS ENUM (
    'official', 'community_verified', 'community_pending'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tcg_judge.ruling_source_type AS ENUM (
    'comprehensive_rules', 'tournament_rules', 'set_faq', 'judge_blog', 'community'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tcg_judge.rulings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tcg TEXT NOT NULL,
  status tcg_judge.ruling_status NOT NULL DEFAULT 'draft',
  hierarchy tcg_judge.ruling_hierarchy NOT NULL DEFAULT 'community_pending',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source_type tcg_judge.ruling_source_type NOT NULL,
  source_url TEXT,
  source_document_version TEXT,
  source_page_number INTEGER,
  cards_involved TEXT[] NOT NULL DEFAULT '{}',
  keywords_involved TEXT[] NOT NULL DEFAULT '{}',
  version TEXT NOT NULL,
  effective_from DATE NOT NULL,
  effective_until DATE,
  replaces UUID REFERENCES tcg_judge.rulings(id),
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  verified_by TEXT[] NOT NULL DEFAULT '{}',
  disputed_by TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL REFERENCES tcg_judge.judge_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  language TEXT NOT NULL DEFAULT 'pt-BR',
  tags TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS tcg_judge.ruling_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruling_id UUID NOT NULL REFERENCES tcg_judge.rulings(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES tcg_judge.matches(id) ON DELETE CASCADE,
  log_sequence INTEGER NOT NULL,
  applied_by TEXT NOT NULL REFERENCES tcg_judge.judge_profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- to_tsvector() não é IMMUTABLE → coluna normal + trigger (não GENERATED ALWAYS)
ALTER TABLE tcg_judge.rulings
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION tcg_judge.update_ruling_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.question, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.answer, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(array_to_string(NEW.keywords_involved, ' '), '')), 'C') ||
    setweight(to_tsvector('portuguese', coalesce(array_to_string(NEW.cards_involved, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rulings_search_vector_update ON tcg_judge.rulings;
CREATE TRIGGER rulings_search_vector_update
  BEFORE INSERT OR UPDATE ON tcg_judge.rulings
  FOR EACH ROW
  EXECUTE FUNCTION tcg_judge.update_ruling_search_vector();

CREATE INDEX IF NOT EXISTS idx_rulings_search ON tcg_judge.rulings USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_rulings_tcg ON tcg_judge.rulings(tcg);
CREATE INDEX IF NOT EXISTS idx_rulings_status ON tcg_judge.rulings(status, hierarchy);
CREATE INDEX IF NOT EXISTS idx_rulings_keywords ON tcg_judge.rulings USING GIN(keywords_involved);
CREATE INDEX IF NOT EXISTS idx_rulings_cards ON tcg_judge.rulings USING GIN(cards_involved);

DROP TRIGGER IF EXISTS rulings_updated_at ON tcg_judge.rulings;
CREATE TRIGGER rulings_updated_at
  BEFORE UPDATE ON tcg_judge.rulings
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.update_updated_at_column();
