from app.runtime.runtime_operational_simplicity.engine import runtime_operational_simplicity_engine_v1


def test_simplicity() -> None:
    r = runtime_operational_simplicity_engine_v1("s")
    assert r["modules_loaded"] >= 1
