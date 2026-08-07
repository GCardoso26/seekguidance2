"""JWT enforce fail-closed em production."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_production_always_enforces_jwt_even_if_flag_true():
    s = Settings(
        environment="production",
        database_url="postgresql://x",
        redis_url="redis://x",
        cpf_salt="x" * 32,
        supabase_jwt_secret="y" * 16,
        judge_supabase_jwt_enforce=True,
    )
    assert s.should_enforce_supabase_jwt() is True


def test_production_rejects_jwt_enforce_false():
    with pytest.raises(ValidationError, match="JUDGE_SUPABASE_JWT_ENFORCE=false"):
        Settings(
            environment="production",
            database_url="postgresql://x",
            redis_url="redis://x",
            cpf_salt="x" * 32,
            supabase_jwt_secret="y" * 16,
            judge_supabase_jwt_enforce=False,
        )


def test_development_can_disable_jwt_enforce():
    s = Settings(
        environment="development",
        database_url="postgresql://x",
        redis_url="redis://x",
        judge_supabase_jwt_enforce=False,
    )
    assert s.should_enforce_supabase_jwt() is False


def test_development_default_does_not_enforce():
    s = Settings(
        environment="development",
        database_url="postgresql://x",
        redis_url="redis://x",
        judge_supabase_jwt_enforce=None,
    )
    assert s.should_enforce_supabase_jwt() is False
