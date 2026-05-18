from app.runtime.runtime_operational_continuity.engine import runtime_operational_continuity_engine_v1


def test_continuity() -> None:
    r = runtime_operational_continuity_engine_v1("c")
    assert r["horizon_days"] == 90
