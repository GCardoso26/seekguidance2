-- Wave 2B: sessões cloud, vereditos partilhados, métricas de crescimento

CREATE TABLE IF NOT EXISTS tcg_judge.judge_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT NOT NULL,
    tcg TEXT NOT NULL,
    title TEXT,
    allow_anonymous_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_judge_sessions_auth_user
    ON tcg_judge.judge_sessions (auth_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS tcg_judge.judge_session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES tcg_judge.judge_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_judge_session_messages_session
    ON tcg_judge.judge_session_messages (session_id, created_at ASC);

CREATE TABLE IF NOT EXISTS tcg_judge.judge_shared_verdicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tcg TEXT NOT NULL,
    question TEXT NOT NULL,
    response JSONB NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_judge_shared_verdicts_created
    ON tcg_judge.judge_shared_verdicts (created_at DESC);

CREATE TABLE IF NOT EXISTS tcg_judge.judge_growth_metrics (
    id BIGSERIAL PRIMARY KEY,
    game TEXT,
    metric_type TEXT NOT NULL,
    metric_value DOUBLE PRECISION,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_judge_growth_metrics_type_created
    ON tcg_judge.judge_growth_metrics (metric_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_judge_growth_metrics_game_created
    ON tcg_judge.judge_growth_metrics (game, created_at DESC);
