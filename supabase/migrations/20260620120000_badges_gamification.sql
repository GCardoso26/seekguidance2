-- Gamificação: badges, moderação expandida

SET search_path TO tcg_judge, public;

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow',
  condition_type TEXT NOT NULL,
  condition_value INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges (user_id, earned_at DESC);

INSERT INTO badges (id, name, description, icon, color, condition_type, condition_value) VALUES
  ('first_ruling', 'Primeira Ruling', 'Consultou sua primeira ruling', 'Zap', 'yellow', 'rulings_count', 1),
  ('ruling_10', 'Curioso', '10 rulings consultadas', 'Search', 'blue', 'rulings_count', 10),
  ('ruling_100', 'Veterano', '100 rulings consultadas', 'Award', 'purple', 'rulings_count', 100),
  ('streak_7', 'Em Sequência', '7 dias consultando', 'Flame', 'orange', 'streak', 7),
  ('streak_30', 'Comprometido', '30 dias consultando', 'Crown', 'gold', 'streak', 30),
  ('streak_90', 'Incansável', '90 dias consultando', 'Flame', 'orange', 'streak', 90),
  ('streak_365', 'Lendário', '365 dias consultando', 'Crown', 'gold', 'streak', 365),
  ('tournament_top8', 'Top 8', 'Chegou no top 8 de um torneio', 'Trophy', 'silver', 'tournament_rank', 8),
  ('tournament_win', 'Campeão', 'Venceu um torneio', 'Trophy', 'gold', 'tournament_rank', 1),
  ('helper', 'Helper', 'Respondeu 10 posts na comunidade', 'MessageCircle', 'green', 'comments_count', 10),
  ('influencer', 'Influencer', '100 seguidores', 'Users', 'pink', 'followers_count', 100)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User badges read own" ON user_badges;
CREATE POLICY "User badges read own" ON user_badges FOR SELECT USING (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "User badges read public" ON user_badges;
CREATE POLICY "User badges read public" ON user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Badges public read" ON badges;
CREATE POLICY "Badges public read" ON badges FOR SELECT USING (true);

-- Moderação: status em denúncias
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE post_reports
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved', 'dismissed')),
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by TEXT REFERENCES player_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_post_reports_status ON post_reports (status, created_at DESC);

DROP POLICY IF EXISTS "Reports admin read" ON post_reports;
CREATE POLICY "Reports admin read" ON post_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.id = auth.uid()::text AND jp.role IN ('admin', 'head_judge')
    )
  );

DROP POLICY IF EXISTS "Reports admin update" ON post_reports;
CREATE POLICY "Reports admin update" ON post_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM judge_profiles jp
      WHERE jp.id = auth.uid()::text AND jp.role IN ('admin', 'head_judge')
    )
  );
