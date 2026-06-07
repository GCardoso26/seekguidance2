-- Fase 3: Perfil, Ranking, Notificações, Pagamentos de inscrição, Ligas

SET search_path TO tcg_judge, public;

-- Perfis de jogador (ligados a judge_profiles)
CREATE TABLE IF NOT EXISTS player_profiles (
  id TEXT PRIMARY KEY REFERENCES judge_profiles(id) ON DELETE CASCADE,
  handle VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  favorite_game VARCHAR(10),
  city VARCHAR(80),
  country VARCHAR(2) DEFAULT 'BR',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  privacy_level VARCHAR(20) NOT NULL DEFAULT 'public'
    CHECK (privacy_level IN ('public', 'friends', 'private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_profiles_handle ON player_profiles(LOWER(handle));

-- Estatísticas por jogo
CREATE TABLE IF NOT EXISTS player_game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  game_code VARCHAR(10) NOT NULL,
  tournaments_played INT NOT NULL DEFAULT 0,
  tournaments_won INT NOT NULL DEFAULT 0,
  top_cuts INT NOT NULL DEFAULT 0,
  matches_won INT NOT NULL DEFAULT 0,
  matches_lost INT NOT NULL DEFAULT 0,
  matches_drawn INT NOT NULL DEFAULT 0,
  game_wins INT NOT NULL DEFAULT 0,
  game_losses INT NOT NULL DEFAULT 0,
  best_finish_placement INT,
  best_finish_tournament_id UUID,
  best_finish_date TIMESTAMPTZ,
  favorite_format VARCHAR(30),
  total_prizes TEXT,
  win_streak INT NOT NULL DEFAULT 0,
  max_win_streak INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, game_code)
);

-- Conquistas (seed)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  rarity VARCHAR(20) NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

CREATE TABLE IF NOT EXISTS player_achievements (
  player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, achievement_id)
);

-- Rankings persistentes
CREATE TABLE IF NOT EXISTS player_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  game_code VARCHAR(10) NOT NULL,
  format VARCHAR(30) NOT NULL DEFAULT 'STANDARD',
  points INT NOT NULL DEFAULT 0,
  tier VARCHAR(20) NOT NULL DEFAULT 'Bronze',
  division INT NOT NULL DEFAULT 1 CHECK (division BETWEEN 1 AND 4),
  matches_played INT NOT NULL DEFAULT 0,
  last_tournament_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, game_code, format)
);

CREATE INDEX IF NOT EXISTS idx_player_rankings_leaderboard
  ON player_rankings(game_code, format, points DESC);

-- Resultados de torneio (histórico)
CREATE TABLE IF NOT EXISTS tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  placement INT,
  total_participants INT,
  match_wins INT NOT NULL DEFAULT 0,
  match_losses INT NOT NULL DEFAULT 0,
  match_draws INT NOT NULL DEFAULT 0,
  points_earned INT NOT NULL DEFAULT 0,
  decklist_id UUID,
  prize TEXT,
  game_code VARCHAR(10),
  format_code VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, tournament_id)
);

-- Notificações in-app
CREATE TABLE IF NOT EXISTS player_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_player_notifications_player
  ON player_notifications(player_id, sent_at DESC);

CREATE TABLE IF NOT EXISTS notification_preferences (
  player_id TEXT PRIMARY KEY REFERENCES player_profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  event_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Taxa de inscrição em torneios
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS entry_fee_cents INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entry_fee_currency VARCHAR(3) DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS city VARCHAR(80),
  ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS prize_pool TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS tournament_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL,
  platform_fee_cents INT NOT NULL DEFAULT 0,
  organizer_receives_cents INT NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  gateway VARCHAR(20) NOT NULL DEFAULT 'stripe',
  gateway_payment_id VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'refunded', 'failed', 'partial_refund')),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_percent INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, player_id)
);

CREATE TABLE IF NOT EXISTS organizer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  amount_cents INT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  method VARCHAR(20) DEFAULT 'pix',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ligas / temporadas
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  game_code VARCHAR(10) NOT NULL,
  format VARCHAR(30) NOT NULL,
  organizer_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  season_start DATE,
  season_end DATE,
  scoring_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  prize_structure JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS league_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  event_date TIMESTAMPTZ,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  points_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
  week_number INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS league_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  total_points INT NOT NULL DEFAULT 0,
  events_played INT NOT NULL DEFAULT 0,
  best_finish INT,
  consistency_bonus INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, player_id)
);

-- Índice de busca de torneios
CREATE INDEX IF NOT EXISTS idx_tournaments_search
  ON tournaments(status, game_code, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_tournaments_location
  ON tournaments(country, city);

-- Seed conquistas
INSERT INTO achievements (code, name, description, icon, rarity) VALUES
  ('FIRST_TOURNAMENT', 'Estreia', 'Participou do primeiro torneio', '🎴', 'common'),
  ('FIRST_WIN', 'Vitória Inicial', 'Ganhou o primeiro torneio', '🏆', 'common'),
  ('TOP_CUT_8', 'Top 8', 'Chegou ao Top 8', '🥉', 'rare'),
  ('TOP_CUT_1', 'Campeão', 'Ganhou um torneio', '🥇', 'epic'),
  ('STREAK_3', 'Sequência de Feras', '3 vitórias consecutivas', '🔥', 'rare'),
  ('STREAK_5', 'Invencível', '5 vitórias consecutivas', '⚡', 'legendary'),
  ('GAME_MASTER_POKEMON', 'Mestre Pokémon', '50 torneios de Pokémon', '⚡', 'epic'),
  ('GAME_MASTER_MTG', 'Planeswalker', '50 torneios de MTG', '🔮', 'epic'),
  ('GAME_MASTER_LORCANA', 'Lendário', '50 torneios de Lorcana', '✨', 'epic'),
  ('GAME_MASTER_SWU', 'Comandante', '50 torneios de SWU', '⭐', 'epic'),
  ('MULTI_GAME', 'Poliglota', 'Participou de 4 jogos diferentes', '🌐', 'rare'),
  ('PERFECT_SWISS', 'Suíço Perfeito', '9-0 em Swiss', '💎', 'legendary')
ON CONFLICT (code) DO NOTHING;

DROP TRIGGER IF EXISTS player_profiles_updated_at ON player_profiles;
CREATE TRIGGER player_profiles_updated_at
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.update_updated_at_column();
