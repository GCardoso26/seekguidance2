from app.observability.live_runtime import mobile_runtime_health_v2_stub


def test_runtime_health_v2() -> None:
    assert mobile_runtime_health_v2_stub(False)["replay_summary"]["checks"]
