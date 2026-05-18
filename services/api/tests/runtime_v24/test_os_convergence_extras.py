"""Extras runtime v24 — dashboards e engines auxiliares."""
from __future__ import annotations

from pathlib import Path

import pytest
from app.runtime.enterprise_support_operations.runtime_enterprise_support_engine_v2 import (
    runtime_enterprise_support_engine_v2,
)
from app.runtime.performance_engineering.runtime_footprint_optimization_engine_v1 import (
    runtime_footprint_optimization_engine_v1,
)
from app.runtime.production_sustainability.runtime_multi_year_reliability_engine_v1 import (
    runtime_multi_year_reliability_engine_v1_stub,
)
from app.runtime.production_sustainability.runtime_operational_sustainability_engine_v2 import (
    runtime_operational_sustainability_engine_v2_stub,
)
from app.runtime.runtime_connected_observability.runtime_real_observability_stabilization_engine_v1 import (  # noqa: E501
    runtime_real_observability_stabilization_engine_v1_stub,
)
from app.runtime.runtime_knowledge_platform.runtime_operational_knowledge_engine_v2 import (
    runtime_operational_knowledge_engine_v2,
)

REPO = Path(__file__).resolve().parents[4]
DASHBOARDS = [
    "executive_runtime_overview_v2.html",
    "ecosystem_governance_console_v1.html",
    "runtime_sustainability_console_v1.html",
    "runtime_mesh_console_v1.html",
    "longitudinal_reliability_console_v1.html",
]


@pytest.mark.parametrize("name", DASHBOARDS)
def test_admin_console_dashboard_exists(name: str) -> None:
    assert (REPO / "apps" / "admin_console_v2" / name).is_file()


def test_footprint_engine() -> None:
    assert runtime_footprint_optimization_engine_v1("v24x")["footprint_score"] > 0


def test_knowledge_v2_engine() -> None:
    assert runtime_operational_knowledge_engine_v2("v24x")["knowledge_score"] > 0


def test_support_v2_engine() -> None:
    assert runtime_enterprise_support_engine_v2("v24x")["support_score"] > 0


def test_obs_stabilization_stub() -> None:
    r = runtime_real_observability_stabilization_engine_v1_stub("v24x")
    assert r["integrity_status"] == "ok"


def test_multi_year_stub() -> None:
    r = runtime_multi_year_reliability_engine_v1_stub("v24x")
    assert r["integrity_status"] == "ok"


def test_sustainability_v2_stub() -> None:
    r = runtime_operational_sustainability_engine_v2_stub("v24x")
    assert r["integrity_status"] == "ok"
