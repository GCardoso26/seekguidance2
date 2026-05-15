"""Testes operational platform v2."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

CASES = {
    "runtime_execution_v11": (
        "app.runtime.production_runtime_v11.runtime_operational_execution_engine_v1",
        "runtime_operational_execution_engine_v1_stub",
        "opv2-exec",
    ),
    "replay_certification_v2": (
        "app.runtime.replay_certification.replay_certification_engine_v2",
        "replay_certification_engine_v2_stub",
        "opv2-cert",
    ),
    "federation_operational_v2": (
        "app.runtime.replay_federation.federation_operational_router_v2",
        "federation_operational_router_v2_stub",
        "opv2-fed",
    ),
    "mobile_runtime_operational_beta_v2": (
        "app.mobile_runtime.mobile_runtime_operational_beta_v2",
        "mobile_runtime_operational_beta_v2_stub",
        "opv2-mobile",
    ),
    "runtime_persistence_real_v2": (
        "app.runtime.persistent_replay_runtime.sqlite_runtime_execution_store_v3",
        "sqlite_runtime_execution_store_v3_stub",
        "opv2-sql",
    ),
    "connected_observability_v2": (
        "app.observability.runtime_exporters.runtime_live_metrics_engine_v2",
        "runtime_live_metrics_engine_v2_stub",
        "opv2-obs",
    ),
    "runtime_incident_workflows_v2": (
        "app.runtime.runtime_incident_management.runtime_incident_recovery_engine_v3",
        "runtime_incident_recovery_engine_v3_stub",
        "opv2-inc",
    ),
    "runtime_cicd_platform_v2": (
        "app.api.openapi_runtime_real.runtime_operational_cicd_engine_v2",
        "runtime_operational_cicd_engine_v2_stub",
        "opv2-ci",
    ),
    "production_deployment_readiness_v2": (
        "app.runtime.deployment_readiness_v2.runtime_deployment_readiness_engine_v2",
        "runtime_deployment_readiness_engine_v2_stub",
        "opv2-dep",
    ),
    "platform_completion_candidate_v2": (
        "app.runtime.platform_completion.runtime_platform_completion_v2",
        "runtime_platform_completion_v2_stub",
        "opv2-plat",
    ),
    "continuous_v22": (
        "app.evaluation.continuous_v22",
        "runtime_operational_regression_v22_stub",
        "sig22",
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
    if dirname == "continuous_v22":
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}() -> None:
    p = {stub}("sig22")
    assert p["operational_confidence"] > 0
'''
    elif dirname in ("runtime_cicd_platform_v2", "replay_certification_v2"):
        extra = ""
        if dirname == "runtime_cicd_platform_v2":
            extra = '''
def test_production_cicd_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production_cicd"
    assert (root / "runtime.production.summary.json").is_file()
'''
        elif dirname == "replay_certification_v2":
            extra = '''
def test_certification_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "certification"
    assert (root / "runtime.certification.summary.json").is_file()
'''
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

td = API / "tests" / "runtime_tooling_v11"
p = td / "test_runtime_tooling_v11_extra.py"
if not p.is_file():
    p.write_text(
        '''"""tooling v11."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_operational_dashboard_v5() -> None:
    p = REPO / "apps" / "judge_console" / "runtime_operational_dashboard_v5.html"
    assert p.is_file()
''',
        encoding="utf-8",
    )

print("ok")
