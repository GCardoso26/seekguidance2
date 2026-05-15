"""Continuous v24."""
from __future__ import annotations

from .certification_regression import certification_regression_v24_stub
from .cicd_regression import cicd_regression_v24_stub
from .deployment_regression import deployment_regression_v24_stub
from .federation_regression import federation_regression_v24_stub
from .mobile_regression import mobile_regression_v24_stub
from .observability_regression import observability_regression_v24_stub
from .operational_readiness_regression import operational_readiness_regression_v24_stub
from .platform_completion_regression import platform_completion_regression_v24_stub
from .reliability_regression import reliability_regression_v24_stub
from .replay_integrity_regression import replay_integrity_regression_v24_stub

__all__ = [
    "reliability_regression_v24_stub",
    "deployment_regression_v24_stub",
    "certification_regression_v24_stub",
    "federation_regression_v24_stub",
    "mobile_regression_v24_stub",
    "observability_regression_v24_stub",
    "replay_integrity_regression_v24_stub",
    "operational_readiness_regression_v24_stub",
    "cicd_regression_v24_stub",
    "platform_completion_regression_v24_stub",
]
