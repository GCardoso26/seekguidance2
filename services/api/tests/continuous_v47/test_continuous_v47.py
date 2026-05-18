import importlib

import pytest

V47 = [
    "deployment_v2_regression_v47_stub",
    "observability_v2_regression_v47_stub",
    "persistence_regression_v47_stub",
    "backup_regression_v47_stub",
    "onboarding_regression_v47_stub",
    "pilot_v2_regression_v47_stub",
    "incident_collection_regression_v47_stub",
    "support_operations_regression_v47_stub",
    "usage_analytics_regression_v47_stub",
    "operational_ux_regression_v47_stub",
]


@pytest.mark.parametrize("fn", V47)
def test_v47(fn: str) -> None:
    mod = importlib.import_module("app.evaluation.continuous_v47")
    assert getattr(mod, fn)("s")["operational_confidence"] == 0.94
