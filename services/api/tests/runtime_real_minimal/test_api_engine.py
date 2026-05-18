from app.runtime.runtime_real_minimal.api_engine import runtime_real_api_engine_v1


def test_api_engine() -> None:
    r = runtime_real_api_engine_v1("api")
    assert r["status"] == "operational"
