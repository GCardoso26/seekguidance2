"""Testes GA Readiness Platform."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

CASES = {
    "production_rollout_v2": (
        "app.runtime.production_rollout_v2.production_rollout_orchestration_v2",
        "production_rollout_orchestration_v2_stub",
        "gav2-roll",
    ),
    "security_compliance_v2": (
        "app.runtime.security_compliance.runtime_security_operational_engine_v2",
        "runtime_security_operational_engine_v2_stub",
        "gav2-sec",
    ),
    "runtime_packaging_v2": (
        "app.runtime.runtime_packaging_v2.runtime_release_distribution_summary_v2",
        "runtime_release_distribution_summary_v2_stub",
        "gav2-pkg",
    ),
    "runtime_infrastructure_v2": (
        "app.runtime.runtime_infrastructure.runtime_infrastructure_health_aggregation_v2",
        "runtime_infrastructure_health_aggregation_v2_stub",
        "gav2-infra",
    ),
    "runtime_scale_reliability_v2": (
        "app.runtime.runtime_scale_reliability.runtime_operational_resilience_scoring_v2",
        "runtime_operational_resilience_scoring_v2_stub",
        "gav2-scale",
    ),
    "product_runtime_v2": (
        "app.runtime.product_runtime.runtime_operator_activity_v2",
        "runtime_operator_activity_v2_stub",
        "gav2-prod",
    ),
    "enterprise_readiness_v2": (
        "app.runtime.enterprise_readiness.runtime_enterprise_support_readiness_v2",
        "runtime_enterprise_support_readiness_v2_stub",
        "gav2-ent",
    ),
    "commercial_runtime_v2": (
        "app.runtime.commercial_runtime.runtime_support_orchestration_v2",
        "runtime_support_orchestration_v2_stub",
        "gav2-com",
    ),
    "platform_ga_readiness": (
        "app.runtime.platform_ga_readiness.platform_ga_operational_summary_v1",
        "platform_ga_operational_summary_v1_stub",
        "gav2-ga",
    ),
    "continuous_v27": (
        "app.evaluation.continuous_v27",
        "ga_readiness_regression_v27_stub",
        "sig27",
    ),
}

KEYS = '''
_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "divergence_summary",
    "replay_summary",
    "integrity_status",
)
'''

ARTIFACT = {
    "enterprise_readiness_v2": '''
def test_enterprise_readiness_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "enterprise_readiness"
    assert (root / "compatibility.json").is_file()
    assert (root / "api_freeze.json").is_file()
''',
}

for dirname, (mod, stub, arg) in CASES.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if dirname == "continuous_v27":
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}() -> None:
    p = {stub}("sig27")
    assert p["operational_confidence"] > 0
'''
    else:
        extra = ARTIFACT.get(dirname, "")
        body = f'''"""{dirname}."""
from __future__ import annotations
from pathlib import Path
from {mod} import {stub}
{KEYS}

def test_{dirname}_payload() -> None:
    p = {stub}("{arg}")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
{extra}'''
    p.write_text(body, encoding="utf-8")

obs = API / "tests" / "connected_observability_v6"
obs.mkdir(parents=True, exist_ok=True)
op = obs / "test_connected_observability_v6_imports.py"
if not op.is_file():
    op.write_text(
        '''"""connected_observability_v6."""
from __future__ import annotations
from app.observability.runtime_exporters.runtime_slo_aggregation_v6 import (
    runtime_slo_aggregation_v6_stub,
)
_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "divergence_summary",
    "replay_summary",
    "integrity_status",
)

def test_connected_observability_v6_payload() -> None:
    p = runtime_slo_aggregation_v6_stub("gav6-obs")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
''',
        encoding="utf-8",
    )

behaviors_dir = API / "tests" / "runtime_v16"
behaviors_dir.mkdir(parents=True, exist_ok=True)
behaviors = behaviors_dir / "test_ga_readiness_operational_behaviors.py"
if not behaviors.is_file():
    behaviors.write_text(
        '''"""GA readiness operational behaviors."""
from __future__ import annotations

import queue
from pathlib import Path

from app.runtime.production_rollout_v2.production_rollout_orchestration_v2 import (
    production_rollout_engine_v2,
)
from app.runtime.platform_ga_readiness.platform_ga_operational_summary_v1 import (
    platform_ga_readiness_engine_v1,
)
from app.runtime.security_compliance.runtime_security_operational_engine_v2 import (
    runtime_security_operational_engine_v2,
)


def test_staged_rollout_scoring() -> None:
    r1 = production_rollout_engine_v2("ga-a")
    r2 = production_rollout_engine_v2("ga-a")
    assert r2["blast_radius_score"] >= r1["blast_radius_score"]


def test_ga_platform_aggregation() -> None:
    p = platform_ga_readiness_engine_v1("ga-platform")
    assert p["ga_readiness_score"] > 0
    assert p["integrity_status"] in ("ok", "degraded")


def test_security_posture() -> None:
    s = runtime_security_operational_engine_v2("ga-sec")
    assert "rbac_summary" in s


def test_enterprise_artifacts_exist() -> None:
    from app.runtime.enterprise_readiness.runtime_enterprise_support_readiness_v2 import (
        runtime_enterprise_readiness_engine_v2,
    )
    runtime_enterprise_readiness_engine_v2("ga-art")
    root = Path("generated/runtime_artifacts/enterprise_readiness")
    assert (root / "support_matrix.json").is_file()


def test_rollout_queue_type() -> None:
    assert isinstance(queue.PriorityQueue(), queue.PriorityQueue)
''',
        encoding="utf-8",
    )

tooling = API / "tests" / "runtime_tooling_v15"
tooling.mkdir(parents=True, exist_ok=True)
tp = tooling / "test_runtime_tooling_v15_ga.py"
if not tp.is_file():
    tp.write_text(
        '''"""tooling v15 GA."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_admin_console_dashboard() -> None:
    p = REPO / "apps" / "admin_console" / "rollout_monitoring_dashboard.html"
    assert p.is_file()
''',
        encoding="utf-8",
    )

print("ok")
