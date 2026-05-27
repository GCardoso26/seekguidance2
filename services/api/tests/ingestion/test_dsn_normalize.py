"""Testes de normalização DATABASE_URL para ingestão."""

from __future__ import annotations

from tcg_judge_ingestion.storage.dsn import (
    asyncpg_connect_kwargs,
    normalize_asyncpg_dsn,
    repair_unencoded_hash_in_dsn,
)


def test_repair_password_with_hash() -> None:
    broken = (
        "postgresql+asyncpg://postgres.ref:Sirius#husky93@"
        "aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
    )
    fixed = repair_unencoded_hash_in_dsn(broken)
    assert "Sirius%23husky93" in fixed
    assert "#husky93@" not in fixed
    parsed = normalize_asyncpg_dsn(fixed)
    assert "pooler.supabase.com:5432" in parsed


def test_supabase_ssl_auto() -> None:
    url = "postgresql://postgres.ref:pass@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
    _, kwargs = asyncpg_connect_kwargs(url)
    assert kwargs.get("ssl") == "require"
