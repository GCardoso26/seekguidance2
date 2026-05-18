import pytest
from app.runtime.runtime_minimal_federation.engine import runtime_minimal_federation_engine_v1
from app.runtime.runtime_real_auth.engine import runtime_real_auth_engine_v1
from app.runtime.runtime_real_replay.engine import runtime_real_replay_engine_v1
from app.runtime.runtime_real_tenant.engine import runtime_real_tenant_engine_v1

SCOPES = [f"scope-{i}" for i in range(80)]


@pytest.mark.parametrize("scope", SCOPES)
def test_auth_status_matrix(scope: str) -> None:
    r = runtime_real_auth_engine_v1(scope, action="status")
    assert r["integrity_status"] == "ok"


@pytest.mark.parametrize("scope", SCOPES[:40])
def test_replay_list_matrix(scope: str, tmp_path) -> None:
    db = str(tmp_path / f"{scope}.sqlite")
    r = runtime_real_replay_engine_v1(scope, storage_path=db, action="list")
    assert r["integrity_status"] == "ok"


@pytest.mark.parametrize("scope", SCOPES[:20])
def test_tenant_matrix(scope: str) -> None:
    r = runtime_real_tenant_engine_v1(scope)
    assert "tenants" in r


@pytest.mark.parametrize("scope", SCOPES[:20])
def test_federation_matrix(scope: str) -> None:
    r = runtime_minimal_federation_engine_v1(scope)
    assert r["sync_mode"] == "basic"
