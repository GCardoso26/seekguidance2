"""Cria testes sprint v6."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

TESTS = {
    "runtime_execution_v6": (
        "app.runtime.production_runtime.runtime_execution_orchestrator_v3",
        "runtime_execution_orchestrator_v3_stub",
        "scope",
    ),
    "replay_execution_v6": (
        "app.runtime.persistent_replay_runtime.replay_execution_runtime_v3",
        "replay_execution_runtime_v3_stub",
        "replay-ref",
    ),
    "federation_supervision_v6": (
        "app.runtime.replay_federation.federation_supervisor_runtime_v3",
        "federation_supervisor_runtime_v3_stub",
        "node-a",
    ),
    "replay_persistence_v6": (
        "app.runtime.persistent_replay_runtime.sqlite_replay_execution_store_v2",
        "sqlite_replay_execution_store_v2_stub",
        "ref",
    ),
    "mobile_sync_v6": (
        "app.mobile_runtime.mobile_runtime_sync_engine_v5",
        "mobile_runtime_sync_engine_v5_stub",
        "device",
    ),
    "openapi_ci_v6": (
        "app.api.openapi_runtime_real.runtime_openapi_ci_summary_v2",
        "runtime_openapi_ci_summary_v2_stub",
        "run6",
    ),
    "runtime_observability_v6": (
        "app.observability.runtime_exporters.runtime_metrics_buffer_v3",
        "runtime_metrics_buffer_v3_stub",
        "scope",
    ),
    "runtime_incident_v6": (
        "app.runtime.runtime_incident_management.runtime_incident_orchestrator_v2",
        "runtime_incident_orchestrator_v2_stub",
        "scope",
    ),
    "pilot_runtime_v3": (
        "app.runtime.pilot_runtime.pilot_runtime_execution_v3",
        "pilot_runtime_execution_v3_stub",
        "scope",
    ),
    "continuous_v15": (
        "app.evaluation.continuous_v15",
        "runtime_execution_regression_v15_stub",
        "sig",
    ),
    "executable_datasets_v5": None,
    "internal_tooling_v6": None,
}

for dirname, spec in TESTS.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if spec is None and dirname == "internal_tooling_v6":
        p.write_text(
            '''"""Internal tooling v6."""
from __future__ import annotations
from pathlib import Path
REPO = Path(__file__).resolve().parents[4]

def test_runtime_execution_console_v2() -> None:
    assert (REPO / "apps" / "judge_console" / "runtime_execution_console_v2.html").is_file()
''',
            encoding="utf-8",
        )
    elif spec is None:
        p.write_text(
            '''"""Executable datasets v5."""
from __future__ import annotations
from pathlib import Path
import json

API = Path(__file__).resolve().parents[2]

def test_executable_real_replay_v5_manifest() -> None:
    p = API / "evaluation" / "runtime_execution" / "executable_real_replay_v5" / "manifest.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    assert data.get("dataset_version") == "real-v5"
''',
            encoding="utf-8",
        )
    else:
        mod, stub, arg = spec
        if dirname == "continuous_v15":
            body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}() -> None:
    p = {stub}("{arg}")
    assert p["runtime_confidence"] > 0
    assert "drift_summary" in p
'''
        else:
            body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}_payload() -> None:
    p = {stub}("{arg}")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
'''
        p.write_text(body, encoding="utf-8")
print("tests done")
