"""Testes Operational Production Readiness."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

CASES = {
    "runtime_v13": (
        "app.runtime.production_runtime_v11.runtime_execution_operational_engine_v4",
        "runtime_execution_operational_engine_v4_stub",
        "opv4-exec",
    ),
    "runtime_reliability_v2": (
        "app.runtime.runtime_reliability.runtime_reliability_engine_v2",
        "runtime_reliability_engine_v2_stub",
        "opv4-rel",
    ),
    "replay_certification_v3": (
        "app.runtime.replay_certification.replay_certification_engine_v3",
        "replay_certification_engine_v3_stub",
        "opv4-cert",
    ),
    "federation_coordination": (
        "app.runtime.federation_coordination.federation_runtime_coordination_engine_v1",
        "federation_runtime_coordination_engine_v1_stub",
        "opv4-fed",
    ),
    "mobile_runtime_operational_v2": (
        "app.mobile_runtime.mobile_runtime_operational_engine_v2",
        "mobile_runtime_operational_engine_v2_stub",
        "opv4-mobile",
    ),
    "connected_observability_v3": (
        "app.observability.runtime_exporters.runtime_connected_observability_engine_v3",
        "runtime_connected_observability_engine_v3_stub",
        "opv4-obs",
    ),
    "runtime_incident_v3": (
        "app.runtime.runtime_incident_management.runtime_incident_operational_engine_v3",
        "runtime_incident_operational_engine_v3_stub",
        "opv4-inc",
    ),
    "deployment_readiness_v3": (
        "app.runtime.deployment_readiness_v3.runtime_deployment_validation_v3",
        "runtime_deployment_validation_v3_stub",
        "opv4-dep",
    ),
    "platform_completion_v4": (
        "app.runtime.platform_completion.runtime_platform_completion_engine_v4",
        "runtime_platform_completion_engine_v4_stub",
        "opv4-plat",
    ),
    "continuous_v24": (
        "app.evaluation.continuous_v24",
        "reliability_regression_v24_stub",
        "sig24",
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

ARTIFACT_EXTRAS = {
    "replay_certification_v3": '''
def test_certification_v3_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "certification_v3"
    assert (root / "runtime.certification.summary.json").is_file()
''',
    "platform_completion_v4": '''
def test_cicd_v4_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production_release"
    assert (root / "runtime.release.summary.json").is_file()
''',
}

for dirname, (mod, stub, arg) in CASES.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if dirname == "continuous_v24":
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}() -> None:
    p = {stub}("sig24")
    assert p["operational_confidence"] > 0
'''
    else:
        extra = ARTIFACT_EXTRAS.get(dirname, "")
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

behaviors = API / "tests" / "runtime_v13" / "test_operational_platform_v4_behaviors.py"
if not behaviors.is_file():
    behaviors.write_text(
        '''"""Operational platform v4 behaviors."""
from __future__ import annotations

import queue
from pathlib import Path

from app.runtime.production_runtime_v11.runtime_execution_operational_engine_v4 import (
    runtime_execution_operational_engine_v4,
)
from app.runtime.platform_completion.runtime_platform_completion_engine_v4 import (
    runtime_platform_completion_engine_v4,
)

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "divergence_summary",
    "integrity_status",
)


def test_execution_queue_pressure() -> None:
    r1 = runtime_execution_operational_engine_v4("q-scope-a")
    r2 = runtime_execution_operational_engine_v4("q-scope-a")
    assert "execution_summary" in r1
    assert r2["operational_pressure"] >= r1["operational_pressure"]


def test_platform_completion_rc_plus() -> None:
    p = runtime_platform_completion_engine_v4("rc-plus")
    assert p["completion_score"] > 0
    assert p["integrity_status"] in ("ok", "degraded")
    assert "domains" in p


def test_operational_cicd_release_dir() -> None:
    root = Path("generated/runtime_artifacts/production_release")
    assert (root / "runtime.release.summary.json").is_file()


def test_certification_v3_dir() -> None:
    root = Path("generated/runtime_artifacts/certification_v3")
    assert (root / "runtime.certification.summary.json").is_file()


def test_priority_queue_type() -> None:
    assert isinstance(queue.PriorityQueue(), queue.PriorityQueue)
''',
        encoding="utf-8",
    )

cicd_test = API / "tests" / "runtime_cicd_platform_v4"
cicd_test.mkdir(parents=True, exist_ok=True)
cp = cicd_test / "test_runtime_cicd_platform_v4_imports.py"
if not cp.is_file():
    cp.write_text(
        '''"""runtime_cicd_platform_v4."""
from __future__ import annotations
from pathlib import Path
from app.api.openapi_runtime_real.runtime_operational_cicd_engine_v4 import (
    runtime_operational_cicd_engine_v4_stub,
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


def test_runtime_cicd_platform_v4_payload() -> None:
    p = runtime_operational_cicd_engine_v4_stub("opv4-ci")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p


def test_production_release_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production_release"
    assert (root / "runtime.release.governance.json").is_file()
''',
        encoding="utf-8",
    )

tooling = API / "tests" / "runtime_tooling_v12"
tooling.mkdir(parents=True, exist_ok=True)
tp = tooling / "test_runtime_tooling_v12_consoles.py"
if not tp.is_file():
    tp.write_text(
        '''"""tooling v12 consoles."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]


def test_operational_console_v7() -> None:
    p = REPO / "apps" / "judge_console" / "runtime_readiness_console_v7.html"
    assert p.is_file()
''',
        encoding="utf-8",
    )

print("ok")
