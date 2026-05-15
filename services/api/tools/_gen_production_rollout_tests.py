"""Testes Production Rollout Foundation."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

CASES = {
    "production_rollout": (
        "app.runtime.production_rollout.production_rollout_runtime_v1",
        "production_rollout_runtime_v1_stub",
        "prov1-roll",
    ),
    "security_compliance": (
        "app.runtime.security_compliance.runtime_security_summary_v1",
        "runtime_security_summary_v1_stub",
        "prov1-sec",
    ),
    "runtime_distribution": (
        "app.runtime.runtime_distribution.runtime_distribution_summary_v1",
        "runtime_distribution_summary_v1_stub",
        "prov1-dist",
    ),
    "runtime_infrastructure": (
        "app.runtime.runtime_infrastructure.runtime_infrastructure_summary_v1",
        "runtime_infrastructure_summary_v1_stub",
        "prov1-infra",
    ),
    "runtime_scale_reliability": (
        "app.runtime.runtime_scale_reliability.runtime_scale_summary_v1",
        "runtime_scale_summary_v1_stub",
        "prov1-scale",
    ),
    "product_runtime": (
        "app.runtime.product_runtime.runtime_product_summary_v1",
        "runtime_product_summary_v1_stub",
        "prov1-prod",
    ),
    "enterprise_readiness_v2": (
        "app.runtime.enterprise_readiness.runtime_enterprise_summary_v2",
        "runtime_enterprise_summary_v2_stub",
        "prov1-ent",
    ),
    "commercial_runtime": (
        "app.runtime.commercial_runtime.runtime_commercial_summary_v1",
        "runtime_commercial_summary_v1_stub",
        "prov1-com",
    ),
    "continuous_v26": (
        "app.evaluation.continuous_v26",
        "production_rollout_regression_v26_stub",
        "sig26",
    ),
    "release_governance_v2": (
        "app.api.openapi_runtime_real.runtime_release_governance_v3",
        "runtime_release_governance_v3_stub",
        "prov1-rel",
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
    "release_governance_v2": '''
def test_production_enterprise_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production_enterprise"
    assert (root / "runtime.release.summary.json").is_file()
    assert (root / "runtime.release.semver.json").is_file()
''',
}

for dirname, (mod, stub, arg) in CASES.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    p = td / f"test_{dirname}_imports.py"
    if p.is_file():
        continue
    if dirname == "continuous_v26":
        body = f'''"""{dirname}."""
from __future__ import annotations
from {mod} import {stub}

def test_{dirname}() -> None:
    p = {stub}("sig26")
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

obs = API / "tests" / "connected_observability_v5"
obs.mkdir(parents=True, exist_ok=True)
op = obs / "test_connected_observability_v5_imports.py"
if not op.is_file():
    op.write_text(
        '''"""connected_observability_v5."""
from __future__ import annotations
from app.observability.runtime_exporters.runtime_observability_summary_v5 import (
    runtime_observability_summary_v5_stub,
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

def test_connected_observability_v5_payload() -> None:
    p = runtime_observability_summary_v5_stub("prov5-obs")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
''',
        encoding="utf-8",
    )

behaviors_dir = API / "tests" / "runtime_v15"
behaviors_dir.mkdir(parents=True, exist_ok=True)
behaviors = behaviors_dir / "test_enterprise_operational_platform_behaviors.py"
if not behaviors.is_file():
    behaviors.write_text(
        '''"""Enterprise operational platform behaviors."""
from __future__ import annotations

from pathlib import Path

from app.runtime.production_rollout.production_rollout_runtime_v1 import production_rollout_engine_v1
from app.runtime.security_compliance.runtime_security_summary_v1 import runtime_security_compliance_engine_v1
from app.runtime.commercial_runtime.runtime_commercial_summary_v1 import runtime_commercial_engine_v1
from app.runtime.enterprise_readiness.runtime_enterprise_summary_v2 import (
    runtime_enterprise_readiness_final_engine_v1,
)


def test_rollout_tenant_registry() -> None:
    r = production_rollout_engine_v1("roll-a")
    assert r["rollout_score"] > 0
    assert "tenant_registry" in r


def test_rbac_maps() -> None:
    r = runtime_security_compliance_engine_v1("sec-b")
    assert "rbac_capability_maps" in r
    assert "read:api" in r["rbac_capability_maps"]["sec-b"]


def test_semver_metadata() -> None:
    r = runtime_enterprise_readiness_final_engine_v1("ent-c")
    assert "semver_registry" in r
    assert r["semver_registry"]["ent-c"] == "1.0.0-production"


def test_billing_quota_scoring() -> None:
    r = runtime_commercial_engine_v1("com-d")
    assert r["commercial_score"] > 0
    assert "quota_aggregation" in r


def test_production_enterprise_release_dir() -> None:
    from app.api.openapi_runtime_real.runtime_release_governance_v3 import (
        runtime_release_governance_engine_v3,
    )
    runtime_release_governance_engine_v3("rel-e")
    root = Path("generated/runtime_artifacts/production_enterprise")
    assert (root / "runtime.release.lifecycle.json").is_file()
''',
        encoding="utf-8",
    )

tooling = API / "tests" / "runtime_tooling_v14"
tooling.mkdir(parents=True, exist_ok=True)
tp = tooling / "test_runtime_tooling_v14_consoles.py"
if not tp.is_file():
    tp.write_text(
        '''"""tooling v14 consoles."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_production_rollout_console_v9() -> None:
    p = REPO / "apps" / "judge_console" / "production_rollout_console_v9.html"
    assert p.is_file()
''',
        encoding="utf-8",
    )

print("ok")
