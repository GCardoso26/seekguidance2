"""Testes Production Consolidation / External Pilot Program."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

CASES = {
    "external_pilot_program": (
        "app.runtime.external_pilot_program.external_pilot_operator_registry_v1",
        "external_pilot_operator_registry_v1_stub",
        "pcv1-pilot",
    ),
    "runtime_consolidation": (
        "app.runtime.runtime_consolidation.runtime_payload_normalization_v1",
        "runtime_payload_normalization_v1_stub",
        "pcv1-cons",
    ),
    "runtime_real_infrastructure": (
        "app.runtime.runtime_infrastructure.runtime_deployment_validation_runtime_v1",
        "runtime_deployment_validation_runtime_v1_stub",
        "pcv1-infra",
    ),
    "enterprise_product_runtime_v3": (
        "app.runtime.product_runtime.runtime_tenant_operator_activity_v3",
        "runtime_tenant_operator_activity_v3_stub",
        "pcv1-prod",
    ),
    "performance_cost_engineering": (
        "app.runtime.performance_engineering.runtime_storage_optimization_summary_v2",
        "runtime_storage_optimization_summary_v2_stub",
        "pcv1-perf",
    ),
    "runtime_governance_real": (
        "app.runtime.execution_governance_v2.runtime_operational_policy_validation_v3",
        "runtime_operational_policy_validation_v3_stub",
        "pcv1-gov",
    ),
    "production_certification": (
        "app.runtime.production_certification.runtime_production_certification_summary_v1",
        "runtime_production_certification_summary_v1_stub",
        "pcv1-cert",
    ),
    "runtime_observability_v7": (
        "app.observability.runtime_exporters.runtime_production_observability_aggregation_v7",
        "runtime_production_observability_aggregation_v7_stub",
        "pcv1-obs",
    ),
    "continuous_v28": (
        "app.evaluation.continuous_v28",
        "operational_production_regression_v28_stub",
        "sig28",
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
    "production_certification": '''
def test_production_certification_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production_certification"
    assert (root / "certification.summary.json").is_file()
    assert (root / "certification.replay.json").is_file()
''',
}

for dirname, (mod, stub, arg) in CASES.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if dirname == "continuous_v28":
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}() -> None:
    p = {stub}("sig28")
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

behaviors_dir = API / "tests" / "runtime_v17"
behaviors_dir.mkdir(parents=True, exist_ok=True)
behaviors = behaviors_dir / "test_operational_production_consolidation_behaviors.py"
if not behaviors.is_file():
    behaviors.write_text(
        '''"""Operational production consolidation behaviors."""
from __future__ import annotations

from pathlib import Path

from app.runtime.external_pilot_program.external_pilot_operator_registry_v1 import (
    external_pilot_program_engine_v1,
)
from app.runtime.runtime_consolidation.runtime_payload_normalization_v1 import (
    runtime_consolidation_engine_v1,
)
from app.runtime.production_certification.runtime_production_certification_summary_v1 import (
    production_certification_engine_v1,
)


def test_pilot_program_registry() -> None:
    r = external_pilot_program_engine_v1("pc-pilot")
    assert r["pilot_score"] > 0
    assert "operator_summaries" in r


def test_consolidation_canonical_layer() -> None:
    r = runtime_consolidation_engine_v1("pc-cons")
    assert r["consolidation_score"] > 0
    assert "canonical_routing_hints" in r


def test_production_certification_artifacts() -> None:
    production_certification_engine_v1("pc-cert-art")
    root = Path("generated/runtime_artifacts/production_certification")
    assert (root / "certification.federation.json").is_file()


def test_consolidation_payload_keys() -> None:
    r = runtime_consolidation_engine_v1("pc-keys")
    norm = r["payload_normalization"]
    for k in (
        "assistant_notes",
        "deterministic_alignment",
        "runtime_confidence",
        "integrity_status",
    ):
        assert k in norm


def test_observability_v7_engine() -> None:
    from app.observability.runtime_exporters.runtime_production_observability_aggregation_v7 import (
        runtime_connected_observability_engine_v7,
    )
    r = runtime_connected_observability_engine_v7("pc-obs7")
    assert r["observability_score"] > 0


def test_governance_real_v3() -> None:
    from app.runtime.execution_governance_v2.runtime_operational_policy_validation_v3 import (
        runtime_operational_governance_engine_v3,
    )
    r = runtime_operational_governance_engine_v3("pc-gov3")
    assert r["governance_score"] > 0


def test_continuous_v28_stub() -> None:
    from app.evaluation.continuous_v28 import operational_production_regression_v28_stub
    p = operational_production_regression_v28_stub("sig28b")
    assert p["operational_confidence"] > 0
''',
        encoding="utf-8",
    )

tooling = API / "tests" / "runtime_tooling_v16"
tooling.mkdir(parents=True, exist_ok=True)
tp = tooling / "test_runtime_tooling_v16_consolidation.py"
if not tp.is_file():
    tp.write_text(
        '''"""tooling v16 consolidation."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_admin_console_v2_dashboard() -> None:
    p = REPO / "apps" / "admin_console_v2" / "tenant_management_dashboard_v2.html"
    assert p.is_file()
''',
        encoding="utf-8",
    )

print("ok")
