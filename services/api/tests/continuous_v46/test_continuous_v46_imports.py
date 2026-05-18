import importlib

import pytest

V46 = [
    "minimal_runtime_api_regression_v46_stub",
    "real_auth_regression_v46_stub",
    "real_replay_regression_v46_stub",
    "real_observability_regression_v46_stub",
    "real_deployment_regression_v46_stub",
    "real_tenant_regression_v46_stub",
    "minimal_federation_regression_v46_stub",
    "real_pilot_regression_v46_stub",
    "operational_continuity_regression_v46_stub",
    "productization_regression_v46_stub",
]


@pytest.mark.parametrize("fn", V46)
def test_continuous_v46(fn: str) -> None:
    mod = importlib.import_module("app.evaluation.continuous_v46")
    stub = getattr(mod, fn)
    out = stub("signal-v46")
    assert out["operational_confidence"] == 0.94
