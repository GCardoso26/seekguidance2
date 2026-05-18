from app.runtime.runtime_productization.engine import runtime_productization_engine_v1


def test_productization() -> None:
    r = runtime_productization_engine_v1("p")
    assert r["sdk_python"] is True
    assert r["runtime_cli"] is True
