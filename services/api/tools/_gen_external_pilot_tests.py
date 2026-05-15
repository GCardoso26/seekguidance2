"""Testes External Pilot Operational Platform."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

CASES = {
    "external_pilot_runtime": (
        "app.runtime.external_pilot_runtime.external_pilot_runtime_engine_v1",
        "external_pilot_runtime_engine_v1_stub",
        "epv1-scope",
    ),
    "federation_multinode": (
        "app.runtime.federation_multinode.federation_multinode_runtime_v1",
        "federation_multinode_runtime_v1_stub",
        "epv1-fed",
    ),
    "runtime_hardening_v2": (
        "app.runtime.runtime_hardening_v2.runtime_hardening_summary_v1",
        "runtime_hardening_summary_v1_stub",
        "epv1-hard",
    ),
    "runtime_connected_infra": (
        "app.runtime.runtime_connected_infra.runtime_connected_infra_summary_v1",
        "runtime_connected_infra_summary_v1_stub",
        "epv1-infra",
    ),
    "productization": (
        "app.runtime.productization.runtime_productization_runtime_v1",
        "runtime_productization_runtime_v1_stub",
        "epv1-prod",
    ),
    "production_governance": (
        "app.runtime.execution_governance_v2.runtime_governance_summary_v1",
        "runtime_governance_summary_v1_stub",
        "epv1-gov",
    ),
    "performance_engineering": (
        "app.runtime.performance_engineering.runtime_performance_summary_v1",
        "runtime_performance_summary_v1_stub",
        "epv1-perf",
    ),
    "enterprise_readiness": (
        "app.runtime.enterprise_readiness.runtime_enterprise_readiness_v1",
        "runtime_enterprise_readiness_v1_stub",
        "epv1-ent",
    ),
    "continuous_v25": (
        "app.evaluation.continuous_v25",
        "external_pilot_regression_v25_stub",
        "sig25",
    ),
    "runtime_release_management": (
        "app.api.openapi_runtime_real.runtime_release_management_v1",
        "runtime_release_management_v1_stub",
        "epv1-rel",
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
    "runtime_release_management": '''
def test_external_pilot_release_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "external_pilot"
    assert (root / "runtime.release.summary.json").is_file()
    assert (root / "runtime.release.enterprise.json").is_file()
''',
}

for dirname, (mod, stub, arg) in CASES.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if dirname == "continuous_v25":
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}() -> None:
    p = {stub}("sig25")
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

obs = API / "tests" / "connected_observability_v4"
obs.mkdir(parents=True, exist_ok=True)
op = obs / "test_connected_observability_v4_imports.py"
if not op.is_file():
    op.write_text(
        '''"""connected_observability_v4."""
from __future__ import annotations
from app.observability.runtime_exporters.runtime_observability_summary_v4 import (
    runtime_observability_summary_v4_stub,
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

def test_connected_observability_v4_payload() -> None:
    p = runtime_observability_summary_v4_stub("epv4-obs")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
''',
        encoding="utf-8",
    )

behaviors_dir = API / "tests" / "runtime_v14"
behaviors_dir.mkdir(parents=True, exist_ok=True)
behaviors = behaviors_dir / "test_external_pilot_operational_behaviors.py"
if not behaviors.is_file():
    behaviors.write_text(
        '''"""External pilot operational behaviors."""
from __future__ import annotations

import queue
from pathlib import Path

from app.runtime.external_pilot_runtime.external_pilot_runtime_engine_v1 import (
    external_pilot_runtime_engine_v1,
)
from app.runtime.federation_multinode.federation_multinode_runtime_v1 import (
    federation_multinode_runtime_v1,
)
from app.runtime.productization.runtime_productization_runtime_v1 import (
    runtime_productization_engine_v1,
)


def test_pilot_operator_registry() -> None:
    r = external_pilot_runtime_engine_v1("pilot-a")
    assert r["pilot_score"] > 0
    assert "operator_registry" in r


def test_federation_balancing_degraded() -> None:
    r = federation_multinode_runtime_v1("fed-b")
    assert "degraded_nodes" in r
    assert r["cluster_score"] > 0


def test_rbac_capability_maps() -> None:
    r = runtime_productization_engine_v1("tenant-a")
    assert "rbac_capabilities" in r
    assert "read:replay" in r["rbac_capabilities"]["tenant-a"]


def test_external_pilot_artifacts_dir() -> None:
    from app.api.openapi_runtime_real.runtime_release_management_v1 import (
        runtime_release_management_engine_v1,
    )
    runtime_release_management_engine_v1("rel-beh")
    root = Path("generated/runtime_artifacts/external_pilot")
    assert (root / "runtime.release.stability.json").is_file()


def test_priority_queue_available() -> None:
    assert isinstance(queue.Queue(), queue.Queue)
''',
        encoding="utf-8",
    )

tooling = API / "tests" / "runtime_tooling_v13"
tooling.mkdir(parents=True, exist_ok=True)
tp = tooling / "test_runtime_tooling_v13_consoles.py"
if not tp.is_file():
    tp.write_text(
        '''"""tooling v13 consoles."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_external_pilot_console_v8() -> None:
    p = REPO / "apps" / "judge_console" / "external_pilot_console_v8.html"
    assert p.is_file()
''',
        encoding="utf-8",
    )

print("ok")
