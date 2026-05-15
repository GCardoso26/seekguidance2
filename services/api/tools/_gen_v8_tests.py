"""Testes sprint v8."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]
REPO = API.parents[1]

TESTS = {
    "runtime_lifecycle_v8": (
        "app.runtime.production_runtime.runtime_lifecycle_engine_v8",
        "runtime_lifecycle_engine_v8_stub",
    ),
    "execution_governance_v2": (
        "app.runtime.execution_governance_v2.execution_governance_engine_v2",
        "execution_governance_engine_v2_stub",
    ),
    "deployment_runtime_v2": (
        "app.runtime.deployment_orchestration.deployment_orchestrator_v1",
        "deployment_orchestrator_v1_stub",
    ),
    "replay_integrity_v5": (
        "app.runtime.persistent_replay_runtime.replay_hash_validation_runtime_v5",
        "replay_hash_validation_runtime_v5_stub",
    ),
    "runtime_incident_v3": (
        "app.runtime.runtime_incident_management.runtime_incident_engine_v3",
        "runtime_incident_engine_v3_stub",
    ),
    "replay_sandbox_v2": (
        "app.runtime.replay_sandbox.replay_sandbox_runtime_v2",
        "replay_sandbox_runtime_v2_stub",
    ),
    "runtime_cicd_v2": (
        "app.api.openapi_runtime_real.runtime_cicd_pipeline_v2",
        "runtime_cicd_pipeline_v2_stub",
    ),
    "federation_rollout_v2": (
        "app.runtime.replay_federation.federation_rollout_guard_v2",
        "federation_rollout_guard_v2_stub",
    ),
    "replay_auditing_v2": (
        "app.runtime.replay_auditing.replay_determinism_audit_v2",
        "replay_determinism_audit_v2_stub",
    ),
    "mobile_runtime_stability_v5": (
        "app.mobile_runtime.mobile_runtime_stability_v5",
        "mobile_runtime_stability_v5_stub",
    ),
    "runtime_resource_governance_v2": (
        "app.runtime.runtime_resource_governance.runtime_resource_enforcement_v2",
        "runtime_resource_enforcement_v2_stub",
    ),
    "runtime_slo_v2": (
        "app.runtime.runtime_slo.runtime_slo_violation_aggregation_v2",
        "runtime_slo_violation_aggregation_v2_stub",
    ),
    "runtime_observability_v5": (
        "app.observability.runtime_exporters.runtime_operational_metrics_v5",
        "runtime_operational_metrics_v5_stub",
    ),
    "pilot_runtime_v3": (
        "app.runtime.pilot_runtime.pilot_runtime_deployment_v3",
        "pilot_runtime_deployment_v3_stub",
    ),
    "continuous_v17": (
        "app.evaluation.continuous_v17",
        "runtime_operational_regression_v17_stub",
    ),
}

for dirname, spec in TESTS.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if dirname == "executable_datasets_v7":
        continue
    mod, stub = spec
    arg = "ref" if "replay" in dirname or "integrity" in dirname else "scope"
    if "mobile" in dirname:
        arg = "device"
    if dirname == "runtime_cicd_v2":
        arg = "run8"
    if dirname == "continuous_v17":
        p.write_text(
            f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}() -> None:
    p = {stub}("sig17")
    assert p["operational_confidence"] > 0
''',
            encoding="utf-8",
        )
    else:
        p.write_text(
            f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}_payload() -> None:
    p = {stub}("{arg}")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
''',
            encoding="utf-8",
        )

# extra dirs
for dirname in ("internal_tooling_v3", "executable_datasets_v7", "runtime_execution_quotas_v7"):
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if dirname == "internal_tooling_v3":
        p.write_text(
            '''"""tooling v3."""
from pathlib import Path
REPO = Path(__file__).resolve().parents[4]

def test_lifecycle_console_v3() -> None:
    assert (REPO / "apps/judge_console/runtime_lifecycle_console_v3.html").is_file()
''',
            encoding="utf-8",
        )
    elif dirname == "executable_datasets_v7":
        p.write_text(
            '''"""datasets v7."""
import json
from pathlib import Path
API = Path(__file__).resolve().parents[2]

def test_manifest_v7() -> None:
    p = API / "evaluation/runtime_execution/executable_real_replay_v7/manifest.json"
    assert json.loads(p.read_text(encoding="utf-8"))["dataset_version"] == "real-v7"
''',
            encoding="utf-8",
        )
    else:
        p.write_text(
            '''"""quotas v7."""
from app.runtime.runtime_execution_quotas.runtime_quota_enforcement_v2 import (
    runtime_quota_enforcement_v2_stub,
)

def test_quota() -> None:
    assert runtime_quota_enforcement_v2_stub("s")["runtime_confidence"] > 0
''',
            encoding="utf-8",
        )
print("ok")
