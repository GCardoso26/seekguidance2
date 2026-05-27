"""Testes P0 — tenant isolation, backup path, middleware."""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from app.core.security.paths import resolve_allowed_backup_path
from app.core.security.tenant import resolve_auth, tenant_from_auth
from app.main import app
from app.runtime.runtime_real_auth import tokens
from app.runtime.runtime_real_auth.engine import runtime_real_auth_engine_v1
from fastapi.testclient import TestClient


@pytest.fixture
def auth_db(tmp_path: Path) -> str:
    return str(tmp_path / "auth.sqlite")


def test_tenant_ignored_from_query_param(auth_db: str, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "development")
    login = runtime_real_auth_engine_v1(
        "t",
        storage_path=auth_db,
        action="login",
        username="admin",
        password="admin",
    )
    tok = login["tokens"]["access_token"]
    client = TestClient(app)
    r = client.get(
        "/runtime/replay?tenant_id=evil-tenant",
        headers={"Authorization": f"Bearer {tok}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data.get("tenant_id") == "default"


def test_backup_path_traversal_rejected() -> None:
    assert resolve_allowed_backup_path("/etc/passwd") is None
    assert resolve_allowed_backup_path("../../../etc/passwd") is None


def test_backup_path_allowed_under_artifacts(tmp_path: Path) -> None:
    root = Path("generated/runtime_artifacts/runtime_backup_v1")
    root.mkdir(parents=True, exist_ok=True)
    backup = root / "test-backup"
    backup.mkdir(exist_ok=True)
    (backup / "manifest.json").write_text("{}", encoding="utf-8")
    resolved = resolve_allowed_backup_path(str(backup))
    assert resolved is not None
    assert resolved.name == "test-backup"


