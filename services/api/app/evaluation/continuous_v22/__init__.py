"""Continuous v22."""
from __future__ import annotations

from .deployment_readiness_regression import deployment_readiness_regression_v22_stub
from .federation_operational_regression import federation_operational_regression_v22_stub
from .mobile_runtime_regression import mobile_runtime_regression_v22_stub
from .observability_platform_regression import observability_platform_regression_v22_stub
from .platform_completion_regression import platform_completion_regression_v22_stub
from .replay_certification_regression import replay_certification_regression_v22_stub
from .replay_integrity_regression import replay_integrity_regression_v22_stub
from .runtime_governance_regression import runtime_governance_regression_v22_stub
from .runtime_operational_regression import runtime_operational_regression_v22_stub
from .runtime_slo_regression import runtime_slo_regression_v22_stub

__all__ = [
    "runtime_operational_regression_v22_stub",
    "replay_certification_regression_v22_stub",
    "federation_operational_regression_v22_stub",
    "mobile_runtime_regression_v22_stub",
    "observability_platform_regression_v22_stub",
    "replay_integrity_regression_v22_stub",
    "deployment_readiness_regression_v22_stub",
    "runtime_governance_regression_v22_stub",
    "runtime_slo_regression_v22_stub",
    "platform_completion_regression_v22_stub",
]
