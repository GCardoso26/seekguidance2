import pytest
from app.runtime.runtime_real_persistence.engine import runtime_real_persistence_engine_v1

SCOPES = [f"persist-{i}" for i in range(120)]


@pytest.mark.parametrize("scope", SCOPES)
def test_persistence_health(scope: str) -> None:
    r = runtime_real_persistence_engine_v1(scope, action="health")
    assert r["runtime_confidence"] == 0.94
