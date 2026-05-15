"""Testes sprint RC."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

CASES = {
    "runtime_operational_rc": (
        "app.runtime.production_runtime.runtime_operational_controller_v1",
        "runtime_operational_controller_v1_stub",
        "rc-ops",
    ),
    "replay_deterministic_auditing_v3": (
        "app.runtime.persistent_replay_runtime.replay_deterministic_audit_runtime_v3",
        "replay_deterministic_audit_runtime_v3_stub",
        "rc-replay",
    ),
    "federation_supervision_rc": (
        "app.runtime.replay_federation.federation_operational_supervisor_v1",
        "federation_operational_supervisor_v1_stub",
        "rc-fed",
    ),
    "mobile_runtime_rc": (
        "app.mobile_runtime.mobile_runtime_reconciliation_engine_v3",
        "mobile_runtime_reconciliation_engine_v3_stub",
        "rc-mobile",
    ),
    "runtime_incident_rc": (
        "app.runtime.runtime_incident_management.runtime_incident_operational_engine_v2",
        "runtime_incident_operational_engine_v2_stub",
        "rc-inc",
    ),
    "runtime_observability_v8": (
        "app.observability.runtime_exporters.runtime_operational_metrics_engine_v8",
        "runtime_operational_metrics_engine_v8_stub",
        "rc-obs",
    ),
    "operational_cicd_rc": (
        "app.api.openapi_runtime_real.runtime_operational_cicd_pipeline_v4",
        "runtime_operational_cicd_pipeline_v4_stub",
        "rc-ci",
    ),
    "pilot_runtime_release_candidate": (
        "app.runtime.pilot_runtime.pilot_runtime_release_candidate_summary_v1",
        "pilot_runtime_release_candidate_summary_v1_stub",
        "rc-pilot",
    ),
    "runtime_governance_rc": (
        "app.runtime.runtime_trust_scoring.runtime_operational_trust_engine_v2",
        "runtime_operational_trust_engine_v2_stub",
        "rc-gov",
    ),
    "continuous_v20": (
        "app.evaluation.continuous_v20",
        "runtime_operational_release_regression_v20_stub",
        "sig20",
    ),
}

KEYS_BLOCK = '''
_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)
'''

for dirname, (mod, stub, arg) in CASES.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if dirname == "continuous_v20":
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}() -> None:
    p = {stub}("sig20")
    assert p["operational_confidence"] > 0
'''
    elif dirname == "operational_cicd_rc":
        body = f'''"""{dirname}."""
from __future__ import annotations
from pathlib import Path
from {mod} import {stub}
{KEYS_BLOCK}

def test_{dirname}_payload() -> None:
    p = {stub}("{arg}")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p

def test_rc_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "release_candidate"
    assert (root / "runtime.release.summary.json").is_file()
'''
    else:
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}
{KEYS_BLOCK}

def test_{dirname}_payload() -> None:
    p = {stub}("{arg}")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
'''
    p.write_text(body, encoding="utf-8")

for dirname in ("executable_datasets_v10", "runtime_release_candidate_tooling"):
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_extra.py"
    if p.is_file():
        continue
    if dirname == "executable_datasets_v10":
        p.write_text(
            '''"""datasets v10."""
import json
from pathlib import Path

API = Path(__file__).resolve().parents[2]

def test_v10_manifest() -> None:
    m = API / "evaluation/runtime_execution/executable_real_governance_v10/manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v10"
''',
            encoding="utf-8",
        )
    else:
        p.write_text(
            '''"""RC tooling consoles."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_release_candidate_console() -> None:
    p = REPO / "apps" / "judge_console" / "runtime_release_candidate_console.html"
    assert p.is_file()
    assert "runtime_confidence" in p.read_text(encoding="utf-8")
''',
            encoding="utf-8",
        )

print("ok")
