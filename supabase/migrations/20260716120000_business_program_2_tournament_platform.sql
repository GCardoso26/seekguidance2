-- Business Program 2 — Tournament Platform (additive, RC1-compatible)
SET search_path TO tcg_judge, public;

-- Store Event (product "Event"; avoid bare table name "events")
CREATE TABLE IF NOT EXISTS store_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  game TEXT,
  format TEXT,
  category TEXT,
  event_type TEXT NOT NULL DEFAULT 'tournament'
    CHECK (event_type IN ('tournament', 'league', 'casual', 'premier', 'other')),
  capacity INT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  venue TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'registration_open', 'live', 'completed', 'cancelled')),
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'unlisted', 'private')),
  image_url TEXT,
  banner_url TEXT,
  organizer_id TEXT,
  rules TEXT,
  policies JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_events_store ON store_events(store_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_events_status ON store_events(status);

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS store_event_id UUID REFERENCES store_events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tournaments_store ON tournaments(store_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_store_event ON tournaments(store_event_id);

CREATE TABLE IF NOT EXISTS store_event_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_event_id UUID NOT NULL REFERENCES store_events(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_event_id, tournament_id)
);

CREATE INDEX IF NOT EXISTS idx_store_event_tournaments_event ON store_event_tournaments(store_event_id);

CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_event_id UUID NOT NULL REFERENCES store_events(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Entry',
  price_cents INT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  capacity INT,
  availability INT,
  lot TEXT,
  sales_deadline TIMESTAMPTZ,
  require_checkin BOOLEAN NOT NULL DEFAULT TRUE,
  online_payment_required BOOLEAN NOT NULL DEFAULT TRUE,
  counter_payment_forbidden BOOLEAN NOT NULL DEFAULT TRUE,
  store_product_id UUID,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'sold_out', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON event_tickets(store_event_id);

CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_event_id UUID NOT NULL REFERENCES store_events(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES event_tickets(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL,
  participant_id UUID,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN (
      'pending_payment', 'paid', 'registered', 'confirmed',
      'checked_in', 'playing', 'completed', 'no_show', 'cancelled', 'refunded'
    )),
  payment_ref TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(store_event_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_registrations_unique_user_tournament
  ON event_registrations(tournament_id, user_id) WHERE tournament_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS event_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  method TEXT NOT NULL DEFAULT 'manual'
    CHECK (method IN ('manual', 'qr', 'code', 'list')),
  actor_user_id TEXT,
  actor_role TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_checkins_tournament ON event_checkins(tournament_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tournament_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_event_id UUID REFERENCES store_events(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL
    CHECK (role IN ('HEAD_JUDGE', 'FLOOR_JUDGE', 'SCOREKEEPER', 'ORGANIZER', 'EVENT_MANAGER')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_staff_user ON tournament_staff(user_id);

CREATE TABLE IF NOT EXISTS tournament_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  participant_user_id TEXT NOT NULL,
  penalty_type TEXT NOT NULL
    CHECK (penalty_type IN ('warning', 'game_loss', 'match_loss', 'dq')),
  notes TEXT,
  judge_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournament_penalties_tournament ON tournament_penalties(tournament_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tournament_prize_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  rank_from INT NOT NULL DEFAULT 1,
  rank_to INT NOT NULL DEFAULT 1,
  prize_type TEXT NOT NULL
    CHECK (prize_type IN ('product', 'credit', 'cash', 'voucher', 'store_credit', 'points')),
  amount_cents INT,
  points INT,
  description TEXT,
  product_ref TEXT,
  auto_distribute BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prize_allocations_tournament ON tournament_prize_allocations(tournament_id);

CREATE TABLE IF NOT EXISTS decklist_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'upload'
    CHECK (source IN ('upload', 'import', 'paste', 'legacy')),
  file_name TEXT,
  content_hash TEXT,
  validation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending', 'valid', 'invalid', 'skipped')),
  deck_check_flag BOOLEAN NOT NULL DEFAULT FALSE,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decklist_archives_tournament ON decklist_archives(tournament_id, user_id);

CREATE TABLE IF NOT EXISTS mart_events (
  store_event_id UUID PRIMARY KEY REFERENCES store_events(id) ON DELETE CASCADE,
  store_id UUID,
  registered_count INT NOT NULL DEFAULT 0,
  checked_in_count INT NOT NULL DEFAULT 0,
  revenue_cents INT NOT NULL DEFAULT 0,
  capacity INT,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  factors JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS mart_tournaments (
  tournament_id UUID PRIMARY KEY REFERENCES tournaments(id) ON DELETE CASCADE,
  store_event_id UUID,
  status TEXT,
  current_round INT NOT NULL DEFAULT 0,
  players_active INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  factors JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS mart_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  rank INT,
  match_points INT NOT NULL DEFAULT 0,
  status TEXT,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, user_id)
);

CREATE TABLE IF NOT EXISTS mart_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL,
  total INT NOT NULL DEFAULT 0,
  by_method JSONB NOT NULL DEFAULT '{}'::jsonb,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL,
  round_number INT NOT NULL DEFAULT 0,
  tables INT NOT NULL DEFAULT 0,
  unresolved INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL,
  reported INT NOT NULL DEFAULT 0,
  confirmed INT NOT NULL DEFAULT 0,
  disputed INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_prizes (
  tournament_id UUID PRIMARY KEY REFERENCES tournaments(id) ON DELETE CASCADE,
  allocations INT NOT NULL DEFAULT 0,
  distributed INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_judges (
  tournament_id UUID PRIMARY KEY REFERENCES tournaments(id) ON DELETE CASCADE,
  staff_count INT NOT NULL DEFAULT 0,
  head_judge_id TEXT,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_penalties (
  tournament_id UUID PRIMARY KEY REFERENCES tournaments(id) ON DELETE CASCADE,
  warnings INT NOT NULL DEFAULT 0,
  game_losses INT NOT NULL DEFAULT 0,
  match_losses INT NOT NULL DEFAULT 0,
  dqs INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_tournament_health (
  tournament_id UUID PRIMARY KEY REFERENCES tournaments(id) ON DELETE CASCADE,
  health_score INT NOT NULL DEFAULT 50 CHECK (health_score BETWEEN 0 AND 100),
  factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE store_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_event_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_prize_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE decklist_archives ENABLE ROW LEVEL SECURITY;
