from app.runtime.runtime_real_deployment.engine import runtime_real_deployment_engine_v1


def test_deployment_artifacts() -> None:
    r = runtime_real_deployment_engine_v1("d")
    assert r["artifacts"]["dockerfile"] is True
