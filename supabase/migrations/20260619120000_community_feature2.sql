-- Feature 2: expansão comunidade + newsletter + feedback + follows + notificações

SET search_path TO tcg_judge, public;

-- Posts: tags, múltiplas imagens, pin
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON community_posts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_community_posts_pinned ON community_posts (community_id, is_pinned DESC, created_at DESC);

-- Salvar posts
CREATE TABLE IF NOT EXISTS saved_posts (
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Denúncias
CREATE TABLE IF NOT EXISTS post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'incorrect', 'other')),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, reporter_id)
);

-- Seguir jogadores
CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_id);

-- Newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  tcg_ids TEXT[] NOT NULL DEFAULT '{}',
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedback da plataforma
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES player_profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion', 'praise', 'other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON feedbacks (user_id, created_at DESC);

-- Notificações in-app
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, read_at, created_at DESC);

-- RLS
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Saved posts own" ON saved_posts;
CREATE POLICY "Saved posts own" ON saved_posts FOR ALL
  USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Reports own" ON post_reports;
CREATE POLICY "Reports own" ON post_reports FOR INSERT WITH CHECK (reporter_id = auth.uid()::text);
CREATE POLICY "Reports view own" ON post_reports FOR SELECT USING (reporter_id = auth.uid()::text);

DROP POLICY IF EXISTS "Follows view" ON follows;
CREATE POLICY "Follows view" ON follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Follows manage own" ON follows;
CREATE POLICY "Follows manage own" ON follows FOR ALL
  USING (follower_id = auth.uid()::text) WITH CHECK (follower_id = auth.uid()::text);

DROP POLICY IF EXISTS "Newsletter public subscribe" ON newsletter_subscribers;
CREATE POLICY "Newsletter public subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Newsletters public read" ON newsletters;
CREATE POLICY "Newsletters public read" ON newsletters FOR SELECT USING (sent_at IS NOT NULL);

DROP POLICY IF EXISTS "Feedback own" ON feedbacks;
CREATE POLICY "Feedback own" ON feedbacks FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid()::text);
CREATE POLICY "Feedback view own" ON feedbacks FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Notifications own" ON notifications;
CREATE POLICY "Notifications own" ON notifications FOR ALL
  USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
