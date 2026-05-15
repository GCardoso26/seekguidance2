"""Continuous v21."""
from __future__ import annotations

from .deployment_readiness_regression import deployment_readiness_regression_v21_stub
from .federation_operational_regression import federation_operational_regression_v21_stub
from .mobile_runtime_regression import mobile_runtime_regression_v21_stub
from .observability_runtime_regression import observability_runtime_regression_v21_stub
from .operational_platform_regression import operational_platform_regression_v21_stub
from .replay_determinism_regression import replay_determinism_regression_v21_stub
from .replay_integrity_regression import replay_integrity_regression_v21_stub
from .runtime_governance_regression import runtime_governance_regression_v21_stub
from .runtime_operational_regression import runtime_operational_regression_v21_stub
from .runtime_slo_regression import runtime_slo_regression_v21_stub

__all__ = [
    "runtime_operational_regression_v21_stub",
    "replay_determinism_regression_v21_stub",
    "federation_operational_regression_v21_stub",
    "mobile_runtime_regression_v21_stub",
    "observability_runtime_regression_v21_stub",
    "replay_integrity_regression_v21_stub",
    "deployment_readiness_regression_v21_stub",
    "runtime_governance_regression_v21_stub",
    "runtime_slo_regression_v21_stub",
    "operational_platform_regression_v21_stub",
]
