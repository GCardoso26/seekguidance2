-- Fase 4: RLS, social, push subscriptions, audit logs

SET search_path TO tcg_judge, public;

-- Push subscriptions (Web Push VAPID)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_player ON push_subscriptions(player_id);

-- Social: amigos
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  addressee_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id, status);

-- Mensagens
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(sender_id, receiver_id, created_at DESC);

-- Comunidades
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  game_code VARCHAR(10),
  created_by TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  avatar_url TEXT,
  member_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, player_id)
);

-- Audit logs (admin)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT REFERENCES judge_profiles(id),
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(40),
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- League participants
CREATE TABLE IF NOT EXISTS league_participants (
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (league_id, player_id)
);

-- ========== RLS ==========

ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_standings ENABLE ROW LEVEL SECURITY;

-- player_profiles
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON player_profiles;
CREATE POLICY "Profiles viewable by everyone"
  ON player_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON player_profiles;
CREATE POLICY "Users update own profile"
  ON player_profiles FOR UPDATE USING (id = auth.uid()::text);

DROP POLICY IF EXISTS "Users insert own profile" ON player_profiles;
CREATE POLICY "Users insert own profile"
  ON player_profiles FOR INSERT WITH CHECK (id = auth.uid()::text);

-- player_rankings (público leitura)
DROP POLICY IF EXISTS "Rankings viewable by everyone" ON player_rankings;
CREATE POLICY "Rankings viewable by everyone"
  ON player_rankings FOR SELECT USING (true);

-- tournament_payments
DROP POLICY IF EXISTS "Users view own payments" ON tournament_payments;
CREATE POLICY "Users view own payments"
  ON tournament_payments FOR SELECT
  USING (player_id = auth.uid()::text);

DROP POLICY IF EXISTS "Organizers view tournament payments" ON tournament_payments;
CREATE POLICY "Organizers view tournament payments"
  ON tournament_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_payments.tournament_id
        AND t.created_by = auth.uid()::text
    )
  );

-- player_notifications
DROP POLICY IF EXISTS "Users view own notifications" ON player_notifications;
CREATE POLICY "Users view own notifications"
  ON player_notifications FOR SELECT USING (player_id = auth.uid()::text);

-- friendships
DROP POLICY IF EXISTS "Users view own friendships" ON friendships;
CREATE POLICY "Users view own friendships"
  ON friendships FOR SELECT
  USING (requester_id = auth.uid()::text OR addressee_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users manage own friend requests" ON friendships;
CREATE POLICY "Users manage own friend requests"
  ON friendships FOR INSERT WITH CHECK (requester_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users update friendships addressed to them" ON friendships;
CREATE POLICY "Users update friendships addressed to them"
  ON friendships FOR UPDATE
  USING (requester_id = auth.uid()::text OR addressee_id = auth.uid()::text);

-- messages
DROP POLICY IF EXISTS "Users view own messages" ON messages;
CREATE POLICY "Users view own messages"
  ON messages FOR SELECT
  USING (sender_id = auth.uid()::text OR receiver_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users send messages" ON messages;
CREATE POLICY "Users send messages"
  ON messages FOR INSERT WITH CHECK (sender_id = auth.uid()::text);

-- communities (público leitura)
DROP POLICY IF EXISTS "Communities viewable by everyone" ON communities;
CREATE POLICY "Communities viewable by everyone"
  ON communities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users create communities" ON communities;
CREATE POLICY "Users create communities"
  ON communities FOR INSERT WITH CHECK (created_by = auth.uid()::text);

-- community_members
DROP POLICY IF EXISTS "Members viewable by everyone" ON community_members;
CREATE POLICY "Members viewable by everyone"
  ON community_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users join communities" ON community_members;
CREATE POLICY "Users join communities"
  ON community_members FOR INSERT WITH CHECK (player_id = auth.uid()::text);

-- push_subscriptions
DROP POLICY IF EXISTS "Users manage own push subs" ON push_subscriptions;
CREATE POLICY "Users manage own push subs"
  ON push_subscriptions FOR ALL
  USING (player_id = auth.uid()::text)
  WITH CHECK (player_id = auth.uid()::text);

-- leagues
DROP POLICY IF EXISTS "Leagues viewable by everyone" ON leagues;
CREATE POLICY "Leagues viewable by everyone"
  ON leagues FOR SELECT USING (true);

DROP POLICY IF EXISTS "Organizers create leagues" ON leagues;
CREATE POLICY "Organizers create leagues"
  ON leagues FOR INSERT WITH CHECK (organizer_id = auth.uid()::text);

-- league_standings
DROP POLICY IF EXISTS "League standings public" ON league_standings;
CREATE POLICY "League standings public"
  ON league_standings FOR SELECT USING (true);
