from app.runtime.runtime_minimal_federation.engine import runtime_minimal_federation_engine_v1


def test_federation_register() -> None:
    runtime_minimal_federation_engine_v1(
        "f",
        action="register",
        node_id="n1",
        endpoint="http://127.0.0.1:8000",
    )
    r = runtime_minimal_federation_engine_v1("f")
    assert r["healthy_count"] >= 0
