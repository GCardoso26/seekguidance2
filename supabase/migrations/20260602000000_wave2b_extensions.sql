-- Wave 2B extensões: favoritos, arquivamento de métricas, colunas opcionais

CREATE TABLE IF NOT EXISTS tcg_judge.saved_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    game_slug TEXT NOT NULL,
    question TEXT NOT NULL,
    verdict TEXT,
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    full_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_answers_user_idx
    ON tcg_judge.saved_answers (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tcg_judge.judge_growth_monthly_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period DATE NOT NULL,
    game TEXT,
    metric_type TEXT NOT NULL,
    total BIGINT NOT NULL,
    unique_users BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (period, game, metric_type)
);

ALTER TABLE tcg_judge.judge_growth_metrics
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_judge_growth_metrics_user
    ON tcg_judge.judge_growth_metrics (user_id, created_at DESC)
    WHERE user_id IS NOT NULL;
