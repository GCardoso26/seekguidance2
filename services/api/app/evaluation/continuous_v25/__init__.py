"""Continuous v25."""
from __future__ import annotations

from .enterprise_readiness_regression import enterprise_readiness_regression_v25_stub
from .external_pilot_regression import external_pilot_regression_v25_stub
from .federation_multinode_regression import federation_multinode_regression_v25_stub
from .governance_regression import governance_regression_v25_stub
from .observability_regression import observability_regression_v25_stub
from .operational_hardening_regression import operational_hardening_regression_v25_stub
from .performance_regression import performance_regression_v25_stub
from .release_management_regression import release_management_regression_v25_stub
from .replay_certification_regression import replay_certification_regression_v25_stub
from .sla_slo_regression import sla_slo_regression_v25_stub

__all__ = [
    "external_pilot_regression_v25_stub",
    "federation_multinode_regression_v25_stub",
    "replay_certification_regression_v25_stub",
    "observability_regression_v25_stub",
    "governance_regression_v25_stub",
    "sla_slo_regression_v25_stub",
    "performance_regression_v25_stub",
    "enterprise_readiness_regression_v25_stub",
    "release_management_regression_v25_stub",
    "operational_hardening_regression_v25_stub",
]
