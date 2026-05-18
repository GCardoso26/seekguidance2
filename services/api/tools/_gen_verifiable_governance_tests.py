"""Testes sprint Verifiable Autonomous Runtime Governance."""
from __future__ import annotations

from pathlib import Path

TESTS = Path(__file__).resolve().parents[1] / "tests"


def w(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def pkg_test(folder: str, pkg: str, modules: list[str], prefix: str, extra: str = "") -> None:
    mods = ",\n    ".join(f'"{m}"' for m in modules)
    w(
        TESTS / folder / f"test_{folder}_modules.py",
        f'''"""{folder}."""
from __future__ import annotations

import importlib

import pytest

_PKG = "{pkg}"
_MODULES = [
    {mods},
]


@pytest.mark.parametrize("name", _MODULES)
def test_{prefix}_stub(name: str) -> None:
    mod = importlib.import_module(f"{{_PKG}}.{{name}}")
    r = getattr(mod, f"{{name}}_stub")(f"{prefix}-{{name}}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
{extra}''',
    )


def sub_test(folder: str, subfile: str, pkg: str, modules: list[str], prefix: str, test_fn: str) -> None:
    mods = ",\n    ".join(f'"{m}"' for m in modules)
    w(
        TESTS / folder / subfile,
        f'''"""{subfile}."""
import importlib
import pytest

_PKG = "{pkg}"
_MODULES = [
    {mods},
]


@pytest.mark.parametrize("name", _MODULES)
def test_{test_fn}_stub(name: str) -> None:
    mod = importlib.import_module(f"{{_PKG}}.{{name}}")
    r = getattr(mod, f"{{name}}_stub")(f"{prefix}-{{name}}")
    assert r["integrity_status"] == "ok"
''',
    )


pkg_test(
    "runtime_verifiable_governance",
    "app.runtime.runtime_verifiable_governance",
    [
        "runtime_verifiable_governance_engine_v1",
        "runtime_causal_verification_v1",
        "runtime_decision_trace_v1",
        "runtime_replayable_causality_v1",
        "runtime_deterministic_reasoning_v1",
        "runtime_governance_evidence_v1",
        "runtime_explainability_lineage_v1",
        "runtime_accountability_mapping_v1",
        "runtime_governance_replayability_v1",
        "runtime_audit_lineage_v1",
        "runtime_long_horizon_traceability_v1",
    ],
    "vrg",
    '''
def test_vrg_artifact() -> None:
    from pathlib import Path
    from app.runtime.runtime_verifiable_governance.runtime_verifiable_governance_engine_v1 import (
        runtime_verifiable_governance_engine_v1,
    )
    runtime_verifiable_governance_engine_v1("vrg-art")
    p = Path("generated/runtime_artifacts/verifiable_governance_v1")
    assert (p / "vrg-art-governance.json").is_file()
''',
)

sub_test(
    "runtime_verifiable_governance",
    "test_causal_audit_modules.py",
    "app.runtime.runtime_causal_audit",
    [
        "runtime_causal_audit_engine_v1",
        "runtime_audit_scoring_v1",
        "runtime_audit_forecasting_v1",
        "runtime_audit_governance_v1",
        "runtime_audit_registry_v1",
        "runtime_audit_heuristics_v1",
        "runtime_audit_balancing_v1",
        "runtime_audit_sustainability_v1",
        "runtime_audit_convergence_v1",
        "runtime_causal_audit_summary_v1",
    ],
    "cau",
    "cau",
)

sub_test(
    "runtime_verifiable_governance",
    "test_decision_traceability_modules.py",
    "app.runtime.runtime_decision_traceability",
    [
        "runtime_decision_traceability_engine_v1",
        "runtime_trace_scoring_v1",
        "runtime_trace_forecasting_v1",
        "runtime_trace_governance_v1",
        "runtime_trace_registry_v1",
        "runtime_trace_heuristics_v1",
        "runtime_trace_balancing_v1",
        "runtime_trace_sustainability_v1",
        "runtime_trace_convergence_v1",
        "runtime_decision_traceability_summary_v1",
    ],
    "dtr",
    "dtr",
)

pkg_test(
    "runtime_human_coordination",
    "app.runtime.runtime_human_coordination",
    [
        "runtime_human_coordination_engine_v1",
        "runtime_operator_supervision_v1",
        "runtime_consensus_propagation_v1",
        "runtime_human_escalation_v1",
        "runtime_supervised_autonomy_v1",
        "runtime_override_lineage_v1",
        "runtime_governance_intervention_v1",
        "runtime_operator_alignment_v1",
        "runtime_approval_coordination_v1",
        "runtime_trust_delegation_v1",
        "runtime_human_loop_resilience_v1",
    ],
    "hum",
    '''
def test_hum_artifact() -> None:
    from pathlib import Path
    from app.runtime.runtime_human_coordination.runtime_human_coordination_engine_v1 import (
        runtime_human_coordination_engine_v1,
    )
    runtime_human_coordination_engine_v1("hum-art")
    p = Path("generated/runtime_artifacts/human_runtime_coordination_v1")
    assert (p / "hum-art-coordination.json").is_file()
''',
)

sub_test(
    "runtime_human_coordination",
    "test_operational_supervision_modules.py",
    "app.runtime.runtime_operational_supervision",
    [
        "runtime_operational_supervision_engine_v1",
        "runtime_supervision_scoring_v1",
        "runtime_supervision_forecasting_v1",
        "runtime_supervision_governance_v1",
        "runtime_supervision_registry_v1",
        "runtime_supervision_heuristics_v1",
        "runtime_supervision_balancing_v1",
        "runtime_supervision_sustainability_v1",
        "runtime_supervision_convergence_v1",
        "runtime_operational_supervision_summary_v1",
    ],
    "sup",
    "sup",
)

sub_test(
    "runtime_human_coordination",
    "test_human_feedback_mesh_modules.py",
    "app.runtime.runtime_human_feedback_mesh",
    [
        "runtime_human_feedback_mesh_engine_v1",
        "runtime_feedback_scoring_v1",
        "runtime_feedback_forecasting_v1",
        "runtime_feedback_governance_v1",
        "runtime_feedback_registry_v1",
        "runtime_feedback_heuristics_v1",
        "runtime_feedback_balancing_v1",
        "runtime_feedback_sustainability_v1",
        "runtime_feedback_convergence_v1",
        "runtime_human_feedback_mesh_summary_v1",
    ],
    "hfm",
    "hfm",
)

pkg_test(
    "runtime_operational_reasoning",
    "app.runtime.runtime_operational_reasoning",
    [
        "runtime_operational_reasoning_engine_v1",
        "runtime_causal_operational_model_v1",
        "runtime_replayable_reasoning_v1",
        "runtime_failure_causality_map_v1",
        "runtime_resilience_causality_v1",
        "runtime_decision_simulation_v1",
        "runtime_causal_forecasting_v1",
        "runtime_multi_domain_reasoning_v1",
        "runtime_governance_reasoning_v1",
        "runtime_distributed_causality_v1",
        "runtime_survivability_reasoning_v1",
    ],
    "rea",
    '''
def test_rea_artifact() -> None:
    from pathlib import Path
    from app.runtime.runtime_operational_reasoning.runtime_operational_reasoning_engine_v1 import (
        runtime_operational_reasoning_engine_v1,
    )
    runtime_operational_reasoning_engine_v1("rea-art")
    p = Path("generated/runtime_artifacts/operational_reasoning_v1")
    assert (p / "rea-art-reasoning.json").is_file()
''',
)

sub_test(
    "runtime_operational_reasoning",
    "test_causal_modeling_modules.py",
    "app.runtime.runtime_causal_modeling",
    [
        "runtime_causal_modeling_engine_v1",
        "runtime_modeling_scoring_v1",
        "runtime_modeling_forecasting_v1",
        "runtime_modeling_governance_v1",
        "runtime_modeling_registry_v1",
        "runtime_modeling_heuristics_v1",
        "runtime_modeling_balancing_v1",
        "runtime_modeling_sustainability_v1",
        "runtime_modeling_convergence_v1",
        "runtime_causal_modeling_summary_v1",
    ],
    "cmo",
    "cmo",
)

sub_test(
    "runtime_operational_reasoning",
    "test_failure_causality_modules.py",
    "app.runtime.runtime_failure_causality",
    [
        "runtime_failure_causality_engine_v1",
        "runtime_failure_scoring_v1",
        "runtime_failure_forecasting_v1",
        "runtime_failure_governance_v1",
        "runtime_failure_registry_v1",
        "runtime_failure_heuristics_v1",
        "runtime_failure_balancing_v1",
        "runtime_failure_sustainability_v1",
        "runtime_failure_convergence_v1",
        "runtime_failure_causality_summary_v1",
    ],
    "fca",
    "fca",
)

pkg_test(
    "runtime_operational_safety",
    "app.runtime.runtime_operational_safety",
    [
        "runtime_operational_safety_engine_v1",
        "runtime_risk_propagation_v1",
        "runtime_failure_prevention_adapt_v1",
        "runtime_safety_envelope_v1",
        "runtime_federation_risk_balance_v1",
        "runtime_topology_risk_survivability_v1",
        "runtime_collapse_prevention_v1",
        "runtime_safety_governance_v1",
        "runtime_resilience_boundaries_v1",
        "runtime_survivability_enforcement_v1",
        "runtime_hazard_forecasting_v1",
    ],
    "saf",
    '''
def test_saf_artifact() -> None:
    from pathlib import Path
    from app.runtime.runtime_operational_safety.runtime_operational_safety_engine_v1 import (
        runtime_operational_safety_engine_v1,
    )
    runtime_operational_safety_engine_v1("saf-art")
    p = Path("generated/runtime_artifacts/operational_safety_v1")
    assert (p / "saf-art-safety.json").is_file()
''',
)

sub_test(
    "runtime_operational_safety",
    "test_risk_coordination_modules.py",
    "app.runtime.runtime_risk_coordination",
    [
        "runtime_risk_coordination_engine_v1",
        "runtime_risk_scoring_v1",
        "runtime_risk_forecasting_v1",
        "runtime_risk_governance_v1",
        "runtime_risk_registry_v1",
        "runtime_risk_heuristics_v1",
        "runtime_risk_balancing_v1",
        "runtime_risk_sustainability_v1",
        "runtime_risk_convergence_v1",
        "runtime_risk_coordination_summary_v1",
    ],
    "rsk",
    "rsk",
)

sub_test(
    "runtime_operational_safety",
    "test_failure_prevention_modules.py",
    "app.runtime.runtime_failure_prevention",
    [
        "runtime_failure_prevention_engine_v1",
        "runtime_prevention_scoring_v1",
        "runtime_prevention_forecasting_v1",
        "runtime_prevention_governance_v1",
        "runtime_prevention_registry_v1",
        "runtime_prevention_heuristics_v1",
        "runtime_prevention_balancing_v1",
        "runtime_prevention_sustainability_v1",
        "runtime_prevention_convergence_v1",
        "runtime_failure_prevention_summary_v1",
    ],
    "fpv",
    "fpv",
)

pkg_test(
    "runtime_formal_certification",
    "app.runtime.runtime_formal_certification",
    [
        "runtime_formal_certification_engine_v1",
        "runtime_continuous_validation_v1",
        "runtime_replay_cert_lineage_v1",
        "runtime_integrity_validation_v1",
        "runtime_survivability_cert_v1",
        "runtime_compliance_cert_v1",
        "runtime_maturity_verification_v1",
        "runtime_continuity_validation_v1",
        "runtime_convergence_validation_v1",
        "runtime_cert_audit_propagation_v1",
    ],
    "for",
    '''
def test_for_artifact() -> None:
    from pathlib import Path
    from app.runtime.runtime_formal_certification.runtime_formal_certification_engine_v1 import (
        runtime_formal_certification_engine_v1,
    )
    runtime_formal_certification_engine_v1("for-art")
    p = Path("generated/runtime_artifacts/formal_operational_certification_v1")
    assert (p / "for-art-certification.json").is_file()
''',
)

sub_test(
    "runtime_formal_certification",
    "test_operational_validation_modules.py",
    "app.runtime.runtime_operational_validation",
    [
        "runtime_operational_validation_engine_v1",
        "runtime_validation_scoring_v1",
        "runtime_validation_forecasting_v1",
        "runtime_validation_governance_v1",
        "runtime_validation_registry_v1",
        "runtime_validation_heuristics_v1",
        "runtime_validation_balancing_v1",
        "runtime_validation_sustainability_v1",
        "runtime_validation_convergence_v1",
        "runtime_operational_validation_summary_v1",
    ],
    "val",
    "val",
)

sub_test(
    "runtime_formal_certification",
    "test_certification_governance_modules.py",
    "app.runtime.runtime_certification_governance",
    [
        "runtime_certification_governance_engine_v1",
        "runtime_cert_gov_scoring_v1",
        "runtime_cert_gov_forecasting_v1",
        "runtime_cert_gov_governance_v1",
        "runtime_cert_gov_registry_v1",
        "runtime_cert_gov_heuristics_v1",
        "runtime_cert_gov_balancing_v1",
        "runtime_cert_gov_sustainability_v1",
        "runtime_cert_gov_convergence_v1",
        "runtime_certification_governance_summary_v1",
    ],
    "cgo",
    "cgo",
)

pkg_test(
    "runtime_constitution",
    "app.runtime.runtime_constitution",
    [
        "runtime_constitution_engine_v1",
        "runtime_constitutional_coordination_v1",
        "runtime_charter_enforcement_v1",
        "runtime_policy_harmonization_const_v1",
        "runtime_governance_continuity_v1",
        "runtime_constitutional_reasoning_v1",
        "runtime_sovereignty_balancing_v1",
        "runtime_policy_interoperability_v1",
        "runtime_gov_survivability_v1",
        "runtime_constitutional_audit_v1",
        "runtime_policy_evolution_gov_v1",
    ],
    "con",
    '''
def test_con_artifact() -> None:
    from pathlib import Path
    from app.runtime.runtime_constitution.runtime_constitution_engine_v1 import (
        runtime_constitution_engine_v1,
    )
    runtime_constitution_engine_v1("con-art")
    p = Path("generated/runtime_artifacts/runtime_constitution_v1")
    assert (p / "con-art-constitution.json").is_file()
''',
)

sub_test(
    "runtime_constitution",
    "test_policy_framework_modules.py",
    "app.runtime.runtime_policy_framework",
    [
        "runtime_policy_framework_engine_v1",
        "runtime_framework_scoring_v1",
        "runtime_framework_forecasting_v1",
        "runtime_framework_governance_v1",
        "runtime_framework_registry_v1",
        "runtime_framework_heuristics_v1",
        "runtime_framework_balancing_v1",
        "runtime_framework_sustainability_v1",
        "runtime_framework_convergence_v1",
        "runtime_policy_framework_summary_v1",
    ],
    "pol",
    "pol",
)

sub_test(
    "runtime_constitution",
    "test_operational_charter_modules.py",
    "app.runtime.runtime_operational_charter",
    [
        "runtime_operational_charter_engine_v1",
        "runtime_charter_scoring_v1",
        "runtime_charter_forecasting_v1",
        "runtime_charter_governance_v1",
        "runtime_charter_registry_v1",
        "runtime_charter_heuristics_v1",
        "runtime_charter_balancing_v1",
        "runtime_charter_sustainability_v1",
        "runtime_charter_convergence_v1",
        "runtime_operational_charter_summary_v1",
    ],
    "cha",
    "cha",
)

pkg_test(
    "runtime_meta_simulation",
    "app.runtime.runtime_operational_simulation",
    [
        "runtime_operational_simulation_engine_v1",
        "runtime_future_simulation_v1",
        "runtime_survivability_projection_v1",
        "runtime_topology_sandbox_v1",
        "runtime_governance_stress_sim_v1",
        "runtime_resilience_simulation_v1",
        "runtime_long_horizon_forecast_sim_v1",
        "runtime_civilization_projection_v1",
        "runtime_collapse_prevention_model_v1",
        "runtime_sustainability_simulation_v1",
        "runtime_scenario_replay_v1",
    ],
    "sim",
    '''
def test_sim_artifact() -> None:
    from pathlib import Path
    from app.runtime.runtime_operational_simulation.runtime_operational_simulation_engine_v1 import (
        runtime_operational_simulation_engine_v1,
    )
    runtime_operational_simulation_engine_v1("sim-art")
    p = Path("generated/runtime_artifacts/meta_operational_simulation_v1")
    assert (p / "sim-art-simulation.json").is_file()
''',
)

sub_test(
    "runtime_meta_simulation",
    "test_meta_sandbox_modules.py",
    "app.runtime.runtime_meta_sandbox",
    [
        "runtime_meta_sandbox_engine_v1",
        "runtime_sandbox_scoring_v1",
        "runtime_sandbox_forecasting_v1",
        "runtime_sandbox_governance_v1",
        "runtime_sandbox_registry_v1",
        "runtime_sandbox_heuristics_v1",
        "runtime_sandbox_balancing_v1",
        "runtime_sandbox_sustainability_v1",
        "runtime_sandbox_convergence_v1",
        "runtime_meta_sandbox_summary_v1",
    ],
    "san",
    "san",
)

sub_test(
    "runtime_meta_simulation",
    "test_ecosystem_projection_modules.py",
    "app.runtime.runtime_ecosystem_projection",
    [
        "runtime_ecosystem_projection_engine_v1",
        "runtime_projection_scoring_v1",
        "runtime_projection_forecasting_v1",
        "runtime_projection_governance_v1",
        "runtime_projection_registry_v1",
        "runtime_projection_heuristics_v1",
        "runtime_projection_balancing_v1",
        "runtime_projection_sustainability_v1",
        "runtime_projection_convergence_v1",
        "runtime_ecosystem_projection_summary_v1",
    ],
    "pro",
    "pro",
)

w(
    TESTS / "runtime_nervous_system_v5" / "test_runtime_nervous_system_v5_modules.py",
    '''"""nervous system v5."""
import importlib
import pytest

_PKG = "app.runtime.runtime_nervous_system"
_MODULES = [
    "runtime_nervous_system_engine_v5",
    "runtime_causal_awareness_v5",
    "runtime_governance_traceability_v5",
    "runtime_distributed_supervision_v5",
    "runtime_situational_awareness_v5",
    "runtime_civilization_telemetry_v5",
    "runtime_resilience_risk_cognition_v5",
    "runtime_constitutional_visibility_v5",
    "runtime_multi_org_alignment_v5",
    "runtime_governance_continuity_v5",
    "runtime_long_horizon_cognition_v5",
]


@pytest.mark.parametrize("name", _MODULES)
def test_ns5_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"ns5-{name}")
    assert r["integrity_status"] == "ok"
''',
)

w(
    TESTS / "continuous_v41" / "test_continuous_v41_imports.py",
    '''"""continuous_v41."""
import importlib
import pytest

_STUBS = [
    "governance_traceability_regression_v41_stub",
    "causal_reasoning_regression_v41_stub",
    "operational_supervision_regression_v41_stub",
    "safety_propagation_regression_v41_stub",
    "certification_continuity_regression_v41_stub",
    "constitutional_governance_regression_v41_stub",
    "operational_simulation_regression_v41_stub",
    "structural_sustainability_regression_v41_stub",
    "ecosystem_projection_regression_v41_stub",
    "human_runtime_coordination_regression_v41_stub",
]


@pytest.mark.parametrize("fn", _STUBS)
def test_v41(fn: str) -> None:
    p = getattr(importlib.import_module("app.evaluation.continuous_v41"), fn)("sig41")
    assert p["operational_confidence"] > 0
    assert any("v40" in str(n).lower() for n in p.get("assistant_notes", []))
''',
)

w(
    TESTS / "executable_datasets_v29" / "test_executable_datasets_v29_extra.py",
    '''"""datasets v29."""
import json
from pathlib import Path
import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_verifiable_governance_v29",
    "executable_real_human_coordination_v29",
    "executable_real_operational_reasoning_v29",
    "executable_real_formal_certification_v29",
    "executable_real_runtime_constitution_v29",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v29_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v29"
''',
)

w(
    TESTS / "evaluation_gates_v29" / "test_gates_v29.py",
    '''"""gates v29."""
import importlib
import pytest

_GATES = [
    "governance_traceability_gate_v29",
    "causal_reasoning_gate_v29",
    "operational_supervision_gate_v29",
    "safety_propagation_gate_v29",
    "constitutional_governance_gate_v29",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v29(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    assert getattr(mod, f"{gate}_stub")("g29")["gate_passed"]
''',
)

w(
    TESTS / "runtime_v30" / "test_verifiable_governance_aggregators.py",
    '''"""runtime v30 aggregators."""
from app.runtime.runtime_constitution.runtime_constitution_engine_v1 import runtime_constitution_engine_v1
from app.runtime.runtime_formal_certification.runtime_formal_certification_engine_v1 import (
    runtime_formal_certification_engine_v1,
)
from app.runtime.runtime_human_coordination.runtime_human_coordination_engine_v1 import (
    runtime_human_coordination_engine_v1,
)
from app.runtime.runtime_nervous_system.runtime_nervous_system_engine_v5 import runtime_nervous_system_engine_v5
from app.runtime.runtime_operational_reasoning.runtime_operational_reasoning_engine_v1 import (
    runtime_operational_reasoning_engine_v1,
)
from app.runtime.runtime_operational_safety.runtime_operational_safety_engine_v1 import (
    runtime_operational_safety_engine_v1,
)
from app.runtime.runtime_operational_simulation.runtime_operational_simulation_engine_v1 import (
    runtime_operational_simulation_engine_v1,
)
from app.runtime.runtime_verifiable_governance.runtime_verifiable_governance_engine_v1 import (
    runtime_verifiable_governance_engine_v1,
)


def test_v30_vrg() -> None:
    assert runtime_verifiable_governance_engine_v1("v30")["verifiable_governance_score"] > 0


def test_v30_hum() -> None:
    assert runtime_human_coordination_engine_v1("v30")["human_coordination_score"] > 0


def test_v30_rea() -> None:
    assert runtime_operational_reasoning_engine_v1("v30")["operational_reasoning_score"] > 0


def test_v30_saf() -> None:
    assert runtime_operational_safety_engine_v1("v30")["operational_safety_score"] > 0


def test_v30_for() -> None:
    assert runtime_formal_certification_engine_v1("v30")["formal_certification_score"] > 0


def test_v30_con() -> None:
    assert runtime_constitution_engine_v1("v30")["constitution_score"] > 0


def test_v30_sim() -> None:
    assert runtime_operational_simulation_engine_v1("v30")["operational_simulation_score"] > 0


def test_v30_ns5() -> None:
    assert runtime_nervous_system_engine_v5("v30")["nervous_system_score"] > 0
''',
)

w(
    TESTS / "runtime_v30" / "test_verifiable_governance_dashboards.py",
    '''"""verifiable governance dashboards."""
from pathlib import Path
import pytest

REPO = Path(__file__).resolve().parents[4]
_DASH = [
    "verifiable_governance_console_v1.html",
    "operational_causality_console_v1.html",
    "runtime_constitution_console_v1.html",
    "operational_safety_console_v1.html",
    "meta_operational_simulation_console_v1.html",
]


@pytest.mark.parametrize("name", _DASH)
def test_dashboard(name: str) -> None:
    assert (REPO / "apps" / "admin_console_v2" / name).is_file()
''',
)

print("tests done")
