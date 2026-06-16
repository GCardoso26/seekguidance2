-- Posts de comunidade + campos extras de perfil do jogador

SET search_path TO tcg_judge, public;

-- Perfil: nascimento, estado BR, TCGs favoritos (múltiplos)
ALTER TABLE player_profiles
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS state VARCHAR(2),
  ADD COLUMN IF NOT EXISTS favorite_tcgs TEXT[] NOT NULL DEFAULT '{}';

-- Posts estilo feed Reddit
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  vote_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);

CREATE TABLE IF NOT EXISTS post_votes (
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id, created_at);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts viewable by everyone" ON community_posts;
CREATE POLICY "Posts viewable by everyone"
  ON community_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users create posts" ON community_posts;
CREATE POLICY "Users create posts"
  ON community_posts FOR INSERT WITH CHECK (author_id = auth.uid()::text);

DROP POLICY IF EXISTS "Authors update own posts" ON community_posts;
CREATE POLICY "Authors update own posts"
  ON community_posts FOR UPDATE USING (author_id = auth.uid()::text);

DROP POLICY IF EXISTS "Authors delete own posts" ON community_posts;
CREATE POLICY "Authors delete own posts"
  ON community_posts FOR DELETE USING (author_id = auth.uid()::text);

DROP POLICY IF EXISTS "Votes viewable by everyone" ON post_votes;
CREATE POLICY "Votes viewable by everyone"
  ON post_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own votes" ON post_votes;
CREATE POLICY "Users manage own votes"
  ON post_votes FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Comments viewable by everyone" ON post_comments;
CREATE POLICY "Comments viewable by everyone"
  ON post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users create comments" ON post_comments;
CREATE POLICY "Users create comments"
  ON post_comments FOR INSERT WITH CHECK (author_id = auth.uid()::text);

DROP POLICY IF EXISTS "Authors delete own comments" ON post_comments;
CREATE POLICY "Authors delete own comments"
  ON post_comments FOR DELETE USING (author_id = auth.uid()::text);
