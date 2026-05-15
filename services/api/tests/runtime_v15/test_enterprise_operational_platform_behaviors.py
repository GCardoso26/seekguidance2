"""Enterprise operational platform behaviors."""
from __future__ import annotations

from pathlib import Path

from app.runtime.commercial_runtime.runtime_commercial_summary_v1 import runtime_commercial_engine_v1
from app.runtime.enterprise_readiness.runtime_enterprise_summary_v2 import (
    runtime_enterprise_readiness_final_engine_v1,
)
from app.runtime.production_rollout.production_rollout_runtime_v1 import production_rollout_engine_v1
from app.runtime.security_compliance.runtime_security_summary_v1 import runtime_security_compliance_engine_v1


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
