"""Testes sprint v9."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

CASES = {
    "runtime_hardening_v1": (
        "app.runtime.runtime_hardening.runtime_module_registry_v1",
        "runtime_module_registry_v1_stub",
        "scope",
    ),
    "runtime_execution_v1": (
        "app.runtime.production_runtime.runtime_execution_worker_v1",
        "runtime_execution_worker_v1_stub",
        "scope",
    ),
    "replay_execution_runtime_v1": (
        "app.runtime.persistent_replay_runtime.replay_execution_runtime_engine_v1",
        "replay_execution_runtime_engine_v1_stub",
        "ref",
    ),
    "federation_supervision_v1": (
        "app.runtime.replay_federation.federation_supervision_runtime_v1",
        "federation_supervision_runtime_v1_stub",
        "node",
    ),
    "runtime_incident_workflows_v1": (
        "app.runtime.runtime_incident_management.runtime_incident_storage_v1",
        "runtime_incident_storage_v1_stub",
        "scope",
    ),
    "runtime_observability_v6": (
        "app.observability.runtime_exporters.runtime_histogram_runtime_v6",
        "runtime_histogram_runtime_v6_stub",
        "scope",
    ),
    "openapi_runtime_enforcement_v1": (
        "app.api.openapi_runtime_real.runtime_openapi_enforcement_v9",
        "runtime_openapi_enforcement_v9_stub",
        "run9",
    ),
    "mobile_runtime_realistic_v1": (
        "app.mobile_runtime.mobile_runtime_sync_engine_v1",
        "mobile_runtime_sync_engine_v1_stub",
        "device",
    ),
    "pilot_runtime_v4": (
        "app.runtime.pilot_runtime.pilot_runtime_execution_runtime_v4",
        "pilot_runtime_execution_runtime_v4_stub",
        "scope",
    ),
    "continuous_v18": (
        "app.evaluation.continuous_v18",
        "runtime_execution_regression_v18_stub",
        "sig",
    ),
}

for dirname, (mod, stub, arg) in CASES.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if dirname == "continuous_v18":
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}() -> None:
    p = {stub}("sig18")
    assert p["operational_confidence"] > 0
'''
    elif dirname == "openapi_runtime_enforcement_v1":
        body = f'''"""{dirname}."""
from __future__ import annotations
from pathlib import Path
from {mod} import {stub}

def test_{dirname}_payload() -> None:
    p = {stub}("{arg}")
    assert p["runtime_confidence"] > 0
    assert "openapi_enforcement_summary" in p

def test_drift_artifact_exists() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "drift"
    assert root.is_dir()
'''
    else:
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}_payload() -> None:
    p = {stub}("{arg}")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
    assert "deterministic_alignment" in p
'''
    p.write_text(body, encoding="utf-8")

for dirname, check in [
    ("executable_datasets_v8", "manifest"),
    ("runtime_execution_v1", None),
]:
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_extra.py"
    if p.is_file():
        continue
    if dirname == "executable_datasets_v8":
        p.write_text(
            '''"""datasets v8."""
import json
from pathlib import Path
API = Path(__file__).resolve().parents[2]

def test_v8_manifest() -> None:
    m = API / "evaluation/runtime_execution/executable_real_operational_v8/manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v8"
''',
            encoding="utf-8",
        )

print("ok")
