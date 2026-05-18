"""Testes auth real."""
from __future__ import annotations

from pathlib import Path

import pytest
from app.runtime.runtime_real_auth import tokens
from app.runtime.runtime_real_auth.engine import runtime_real_auth_engine_v1


@pytest.fixture
def auth_db(tmp_path: Path) -> str:
    return str(tmp_path / "auth.sqlite")


def test_auth_login_success(auth_db: str) -> None:
    r = runtime_real_auth_engine_v1(
        "t",
        storage_path=auth_db,
        action="login",
        username="admin",
        password="admin",
    )
    assert r["authenticated"] is True
    assert "access_token" in r["tokens"]


def test_auth_login_fail(auth_db: str) -> None:
    r = runtime_real_auth_engine_v1(
        "t",
        storage_path=auth_db,
        action="login",
        username="admin",
        password="wrong",
    )
    assert r.get("authenticated") is False


def test_token_refresh(auth_db: str) -> None:
    login = runtime_real_auth_engine_v1(
        "t",
        storage_path=auth_db,
        action="login",
        username="admin",
        password="admin",
    )
    ref = login["tokens"]["refresh_token"]
    r = runtime_real_auth_engine_v1("t", storage_path=auth_db, action="refresh", refresh_token=ref)
    assert r.get("refreshed") is True
    payload = tokens.decode_access(r["tokens"]["access_token"])
    assert payload["role"] == "admin"
