-- Feedback explícito do utilizador (👍/👎) — separado de retrieval_feedback (sinais automáticos)

CREATE TABLE IF NOT EXISTS tcg_judge.judge_user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_slug TEXT NOT NULL,
    question TEXT NOT NULL,
    verdict TEXT,
    rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
    comment TEXT,
    chunk_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_judge_user_feedback_game_created
    ON tcg_judge.judge_user_feedback (game_slug, created_at DESC);
