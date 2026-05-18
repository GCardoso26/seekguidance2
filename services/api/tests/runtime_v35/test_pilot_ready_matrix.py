import pytest
from app.runtime.runtime_real_deployment_v2.engine import runtime_real_deployment_engine_v2
from app.runtime.runtime_real_observability_v2.engine import runtime_real_observability_engine_v2

SCOPES = [f"ops-{i}" for i in range(150)]


@pytest.mark.parametrize("scope", SCOPES)
def test_obs_matrix(scope: str) -> None:
    r = runtime_real_observability_engine_v2(scope)
    assert r["integrity_status"] == "ok"


@pytest.mark.parametrize("scope", SCOPES)
def test_dep_matrix(scope: str) -> None:
    r = runtime_real_deployment_engine_v2(scope)
    assert "checks" in r
