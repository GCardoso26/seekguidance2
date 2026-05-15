"""Testes CPv3."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

CASES = {
    "runtime_reliability_v1": (
        "app.runtime.runtime_reliability.runtime_reliability_engine_v1",
        "runtime_reliability_engine_v1_stub",
        "cpv3-rel",
    ),
    "replay_operational_trust_v1": (
        "app.runtime.replay_certification.replay_operational_trust_engine_v1",
        "replay_operational_trust_engine_v1_stub",
        "cpv3-trust",
    ),
    "federated_production_runtime_v3": (
        "app.runtime.replay_federation.federation_production_router_v3",
        "federation_production_router_v3_stub",
        "cpv3-fed",
    ),
    "mobile_runtime_production_beta_v1": (
        "app.mobile_runtime.mobile_runtime_production_beta_v1",
        "mobile_runtime_production_beta_v1_stub",
        "cpv3-mob",
    ),
    "runtime_persistence_real_v3": (
        "app.runtime.persistent_replay_runtime.sqlite_runtime_replay_archive_v3",
        "sqlite_runtime_replay_archive_v3_stub",
        "cpv3-sql",
    ),
    "runtime_intelligence_v1": (
        "app.observability.runtime_exporters.runtime_intelligence_engine_v1",
        "runtime_intelligence_engine_v1_stub",
        "cpv3-intel",
    ),
    "operational_governance_v3": (
        "app.runtime.execution_governance_v2.runtime_operational_governance_engine_v3",
        "runtime_operational_governance_engine_v3_stub",
        "cpv3-gov",
    ),
    "federation_control_plane_v1": (
        "app.runtime.federation_control_plane.federation_control_plane_engine_v1",
        "federation_control_plane_engine_v1_stub",
        "cpv3-fcp",
    ),
    "runtime_cicd_v3": (
        "app.api.openapi_runtime_real.runtime_operational_cicd_engine_v3",
        "runtime_operational_cicd_engine_v3_stub",
        "cpv3-ci",
    ),
    "platform_completion_candidate_v3": (
        "app.runtime.platform_completion.runtime_platform_completion_v3",
        "runtime_platform_completion_v3_stub",
        "cpv3-plat",
    ),
    "continuous_v23": (
        "app.evaluation.continuous_v23",
        "runtime_operational_regression_v23_stub",
        "sig23",
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
)
'''

for dirname, (mod, stub, arg) in CASES.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if dirname == "continuous_v23":
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}() -> None:
    p = {stub}("sig23")
    assert p["operational_confidence"] > 0
'''
    elif dirname in ("runtime_cicd_v3", "replay_operational_trust_v1"):
        sub = "production_runtime" if dirname == "runtime_cicd_v3" else "trust"
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

def test_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "{sub}"
    assert root.is_dir()
'''
    else:
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}
{KEYS}

def test_{dirname}_payload() -> None:
    p = {stub}("{arg}")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
'''
    p.write_text(body, encoding="utf-8")

# execution v11 test
td = API / "tests/runtime_execution_v11"
p = td / "test_runtime_execution_v11_imports.py"
if not p.is_file():
    p.write_text(
        '''"""execution v11."""
from __future__ import annotations
from app.runtime.production_runtime_v11.runtime_operational_execution_engine_v2 import (
    runtime_operational_execution_engine_v2_stub,
)
_KEYS = ("assistant_notes", "runtime_confidence", "governance_summary")

def test_execution_v2() -> None:
    p = runtime_operational_execution_engine_v2_stub("cpv3-exec")
    assert p["operational_runtime_score"] > 0
    for k in _KEYS:
        assert k in p
''',
        encoding="utf-8",
    )

print("ok")
