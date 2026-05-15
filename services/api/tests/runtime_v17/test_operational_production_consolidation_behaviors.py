"""Operational production consolidation behaviors."""
from __future__ import annotations

from pathlib import Path

from app.runtime.external_pilot_program.external_pilot_operator_registry_v1 import (
    external_pilot_program_engine_v1,
)
from app.runtime.production_certification.runtime_production_certification_summary_v1 import (
    production_certification_engine_v1,
)
from app.runtime.runtime_consolidation.runtime_payload_normalization_v1 import (
    runtime_consolidation_engine_v1,
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


def test_performance_cost_v2() -> None:
    from app.runtime.performance_engineering.runtime_storage_optimization_summary_v2 import (
        performance_cost_engineering_v2,
    )
    r = performance_cost_engineering_v2("pc-perf2")
    assert r["performance_score"] > 0


def test_real_infrastructure_engine() -> None:
    from app.runtime.runtime_infrastructure.runtime_deployment_validation_runtime_v1 import (
        runtime_real_infrastructure_engine_v1,
    )
    r = runtime_real_infrastructure_engine_v1("pc-infra2")
    assert r["infrastructure_score"] > 0


def test_enterprise_product_v3() -> None:
    from app.runtime.product_runtime.runtime_tenant_operator_activity_v3 import (
        enterprise_product_runtime_engine_v3,
    )
    r = enterprise_product_runtime_engine_v3("pc-prod3")
    assert r["product_score"] > 0
