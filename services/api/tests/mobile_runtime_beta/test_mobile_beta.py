"""Mobile beta runtime."""
from app.mobile_runtime import mobile_runtime_beta_readiness_stub


def test_mobile_beta_readiness() -> None:
    p = mobile_runtime_beta_readiness_stub("dev-1")
    assert p["mobile_runtime_hints"]["beta_ready"] is True
