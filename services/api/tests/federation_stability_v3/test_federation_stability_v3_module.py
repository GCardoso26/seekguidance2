"""Federation stability v3."""

from __future__ import annotations

from app.runtime.replay_federation import federation_runtime_stability_v3_stub


def test_federation_stability_v3() -> None:
    p = federation_runtime_stability_v3_stub("fed4")
    assert p["federation_health_score"] > 0
