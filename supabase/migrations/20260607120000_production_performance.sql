-- Sprint Final: índices de produção e cache de leaderboard
-- Nota: CREATE INDEX CONCURRENTLY não roda em migrations transacionais do Supabase.

SET search_path TO tcg_judge, public;

CREATE INDEX IF NOT EXISTS idx_tournaments_status_date
  ON tournaments(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_decklists_game_status
  ON marketplace_decklists(game_code, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_judge_calls_tournament_status_priority
  ON judge_calls(tournament_id, status, priority DESC, created_at);

-- Materialized view para leaderboards (refresh manual ou via pg_cron no dashboard)
DROP MATERIALIZED VIEW IF EXISTS leaderboard_cache;

CREATE MATERIALIZED VIEW leaderboard_cache AS
SELECT
  r.game_code,
  r.format,
  r.player_id,
  r.points,
  r.tier,
  ROW_NUMBER() OVER (
    PARTITION BY r.game_code, r.format
    ORDER BY r.points DESC
  ) AS rank
FROM player_rankings r
WHERE r.matches_played > 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_cache
  ON leaderboard_cache(game_code, format, player_id);

COMMENT ON MATERIALIZED VIEW leaderboard_cache IS
  'Cache de leaderboard. Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache; '
  'Agendar no Supabase Dashboard (pg_cron) a cada 5 min se pg_cron estiver habilitado.';
