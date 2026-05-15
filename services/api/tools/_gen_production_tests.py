"""Testes production pilot sprint."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

CASES = {
    "runtime_operational_v11": (
        "app.runtime.production_runtime.runtime_operational_scheduler_v4",
        "runtime_operational_scheduler_v4_stub",
        "pp-sched",
    ),
    "federation_operational_runtime": (
        "app.runtime.replay_federation.federation_runtime_node_heartbeat_v1",
        "federation_runtime_node_heartbeat_v1_stub",
        "pp-fed",
    ),
    "mobile_runtime_beta_real": (
        "app.mobile_runtime.mobile_runtime_operational_sync_v1",
        "mobile_runtime_operational_sync_v1_stub",
        "pp-mobile",
    ),
    "runtime_persistence_real": (
        "app.runtime.persistent_replay_runtime.sqlite_runtime_temporal_store_v1",
        "sqlite_runtime_temporal_store_v1_stub",
        "pp-sql",
    ),
    "connected_observability": (
        "app.observability.runtime_exporters.runtime_otel_live_connector_v1",
        "runtime_otel_live_connector_v1_stub",
        "pp-otel",
    ),
    "operational_cicd": (
        "app.api.openapi_runtime_real.runtime_operational_cicd_controller_v1",
        "runtime_operational_cicd_controller_v1_stub",
        "pp-ci",
    ),
    "replay_certification": (
        "app.runtime.replay_certification.replay_determinism_certification_v1",
        "replay_determinism_certification_v1_stub",
        "pp-cert",
    ),
    "deployment_readiness": (
        "app.runtime.deployment_readiness.runtime_deployment_validation_v1",
        "runtime_deployment_validation_v1_stub",
        "pp-dep",
    ),
    "platform_completion": (
        "app.runtime.platform_completion.runtime_platform_completion_runtime_v1",
        "runtime_platform_completion_runtime_v1_stub",
        "pp-plat",
    ),
    "continuous_v21": (
        "app.evaluation.continuous_v21",
        "runtime_operational_regression_v21_stub",
        "sig21",
    ),
}

KEYS = '''
_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
    "lineage_summary",
)
'''

for dirname, (mod, stub, arg) in CASES.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if dirname == "continuous_v21":
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}() -> None:
    p = {stub}("sig21")
    assert p["operational_confidence"] > 0
'''
    elif dirname == "operational_cicd":
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

def test_production_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production"
    assert (root / "runtime.release.summary.json").is_file()
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

for dirname in ("executable_datasets_v11", "runtime_tooling_v11"):
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_extra.py"
    if p.is_file():
        continue
    if dirname == "executable_datasets_v11":
        p.write_text(
            '''"""datasets v11."""
import json
from pathlib import Path

API = Path(__file__).resolve().parents[2]

def test_v11_manifest() -> None:
    m = API / "evaluation/runtime_execution/executable_real_operational_v11/manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v11"
''',
            encoding="utf-8",
        )
    else:
        p.write_text(
            '''"""tooling v11."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_platform_completion_console() -> None:
    p = REPO / "apps" / "judge_console" / "platform_completion_console_v1.html"
    assert p.is_file()
    assert "readiness_score" in p.read_text(encoding="utf-8")
''',
            encoding="utf-8",
        )

# pilot runtime test dir
td = API / "tests" / "runtime_operational_v11"
p = td / "test_pilot_runtime_production.py"
if not p.is_file():
    p.write_text(
        '''"""pilot production."""
from __future__ import annotations
from app.runtime.pilot_runtime.pilot_runtime_operational_controller_v2 import (
    pilot_runtime_operational_controller_v2_stub,
)

def test_pilot_v2() -> None:
    out = pilot_runtime_operational_controller_v2_stub("pilot-pp")
    assert out["readiness_score"] > 0
''',
        encoding="utf-8",
    )

print("ok")
