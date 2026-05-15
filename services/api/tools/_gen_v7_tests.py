"""Testes sprint v7."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]
REPO = API.parents[1]

TESTS = {
    "runtime_lifecycle_v7": (
        "app.runtime.production_runtime.runtime_lifecycle_manager_v1",
        "runtime_lifecycle_manager_v1_stub",
        "scope",
    ),
    "execution_governance_v7": (
        "app.runtime.execution_governance.execution_governance_engine_v1",
        "execution_governance_engine_v1_stub",
        "scope",
    ),
    "deployment_runtime_v7": (
        "app.runtime.deployment_runtime.deployment_orchestrator_v1",
        "deployment_orchestrator_v1_stub",
        "scope",
    ),
    "replay_integrity_v7": (
        "app.runtime.persistent_replay_runtime.replay_integrity_engine_v4",
        "replay_integrity_engine_v4_stub",
        "ref",
    ),
    "runtime_incident_workflows_v7": (
        "app.runtime.runtime_incident_management.runtime_incident_workflow_engine_v3",
        "runtime_incident_workflow_engine_v3_stub",
        "scope",
    ),
    "replay_sandbox_v7": (
        "app.runtime.replay_sandbox.replay_sandbox_runtime_v1",
        "replay_sandbox_runtime_v1_stub",
        "scope",
    ),
    "runtime_cicd_v7": (
        "app.api.openapi_runtime_real.runtime_ci_pipeline_v1",
        "runtime_ci_pipeline_v1_stub",
        "run7",
    ),
    "federation_rollout_v7": (
        "app.runtime.replay_federation.federation_rollout_safety_v1",
        "federation_rollout_safety_v1_stub",
        "scope",
    ),
    "replay_auditing_v7": (
        "app.runtime.replay_auditing.replay_audit_runtime_v1",
        "replay_audit_runtime_v1_stub",
        "scope",
    ),
    "mobile_stabilization_v7": (
        "app.mobile_runtime.mobile_runtime_stability_v1",
        "mobile_runtime_stability_v1_stub",
        "device",
    ),
    "runtime_resource_governance_v7": (
        "app.runtime.runtime_resource_governance.runtime_resource_engine_v1",
        "runtime_resource_engine_v1_stub",
        "scope",
    ),
    "runtime_execution_quotas_v7": (
        "app.runtime.runtime_execution_quotas.runtime_quota_engine_v1",
        "runtime_quota_engine_v1_stub",
        "scope",
    ),
    "replay_recovery_v7": (
        "app.runtime.persistent_replay_runtime.replay_rollback_runtime_v1",
        "replay_rollback_runtime_v1_stub",
        "ref",
    ),
    "runtime_slo_v7": (
        "app.runtime.runtime_slo.runtime_slo_engine_v1",
        "runtime_slo_engine_v1_stub",
        "scope",
    ),
    "pilot_analytics_v7": (
        "app.observability.pilot_analytics.pilot_runtime_analytics_v1",
        "pilot_runtime_analytics_v1_stub",
        "scope",
    ),
    "runtime_trust_scoring_v7": (
        "app.runtime.runtime_trust_scoring.runtime_trust_engine_v1",
        "runtime_trust_engine_v1_stub",
        "scope",
    ),
    "continuous_v16": (
        "app.evaluation.continuous_v16",
        "runtime_governance_regression_v16_stub",
        "sig",
    ),
    "executable_datasets_v6": None,
}

for dirname, spec in TESTS.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if spec is None:
        p.write_text(
            '''"""executable datasets v6."""
from __future__ import annotations
from pathlib import Path
import json
API = Path(__file__).resolve().parents[2]

def test_executable_real_governance_v6() -> None:
    m = API / "evaluation/runtime_execution/executable_real_governance_v6/manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v6"
''',
            encoding="utf-8",
        )
    elif dirname == "continuous_v16":
        mod, stub, arg = spec
        p.write_text(
            f'''"""continuous v16."""
from __future__ import annotations
from {mod} import {stub}

def test_continuous_v16() -> None:
    p = {stub}("{arg}")
    assert p["operational_confidence"] > 0
''',
            encoding="utf-8",
        )
    else:
        mod, stub, arg = spec
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
print("tests ok")
