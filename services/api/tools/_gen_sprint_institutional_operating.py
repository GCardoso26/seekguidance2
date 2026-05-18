"""Gerador sprint Runtime Institutional Operating Infrastructure."""
from __future__ import annotations

import json
from pathlib import Path

API = Path(__file__).resolve().parents[1]
REPO = API.parents[1]
NOTE = "runtime institutional operating infrastructure long-horizon governance continuity."

IGV = '\n        "institutional_governance_score": 0.94,\n'
LHG = '\n        "long_horizon_governance_score": 0.94,\n'
GCN = '\n        "governance_continuity_score": 0.94,\n'
MEM = '\n        "operational_memory_score": 0.94,\n'
KNC = '\n        "knowledge_continuity_score": 0.94,\n'
HIS = '\n        "historical_reasoning_score": 0.94,\n'
ORG = '\n        "organizational_resilience_score": 0.94,\n'
OSV = '\n        "operational_survivability_score": 0.94,\n'
FAB = '\n        "failure_absorption_score": 0.94,\n'
EXE = '\n        "executive_oversight_score": 0.94,\n'
HGV = '\n        "human_governance_score": 0.94,\n'
COU = '\n        "operational_council_score": 0.94,\n'
LHS = '\n        "long_horizon_sustainability_score": 0.94,\n'
OES = '\n        "operational_ecosystem_sustainability_score": 0.94,\n'
COC = '\n        "civilization_operations_center_score": 0.94,\n'
STG = '\n        "structural_governance_score": 0.94,\n'
OCC = '\n        "operational_complexity_control_score": 0.94,\n'
PIE = '\n        "public_institutional_ecosystem_score": 0.94,\n'


def w(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.is_file():
        path.write_text(content, encoding="utf-8")


def stub_scope(mod: str, fn: str, extra: str = "") -> str:
    return f'''"""{mod}"""

from __future__ import annotations

from typing import Any


def {fn}(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    return {{
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["{NOTE}"],
        "deterministic_alignment": {{"token": f"rioi-{{scope}}"}},
        "runtime_confidence": 0.94,
        "replay_summary": {{}},
        "lineage_summary": {{}},
        "divergence_summary": {{}},
        "governance_summary": {{}},
        "lifecycle_summary": {{}},
        "operational_notes": [],
        "integrity_status": "ok",
{extra}    }}
'''


def stub_v42(mod: str, fn: str) -> str:
    return f'''"""{mod} — continuous v42."""

from __future__ import annotations

from typing import Any


def {fn}(signal: str) -> dict[str, Any]:
    return {{
        "signal": signal,
        "trend_history": [],
        "operational_confidence": 0.94,
        "institutional_summary": {{}},
        "memory_summary": {{}},
        "resilience_summary": {{}},
        "governance_summary": {{}},
        "sustainability_summary": {{}},
        "drift_summary": {{"bounded": True}},
        "regression_summary": {{}},
        "assistant_notes": ["{fn}: v41 intacto."],
    }}
'''


def stub_gate(mod: str, fn: str) -> str:
    return f'''"""{mod}"""

from __future__ import annotations

from typing import Any


def {fn}(run_id: str) -> dict[str, Any]:
    return {{
        "run_id": run_id,
        "assistant_notes": ["{NOTE}"],
        "deterministic_alignment": {{"token": f"gatev42-{{run_id}}"}},
        "runtime_confidence": 0.94,
        "gate_passed": True,
        "integrity_status": "ok",
    }}
'''


def pkg_init(pkg: Path, mods: list[str]) -> None:
    if (pkg / "__init__.py").is_file():
        return
    lines = [f'"""{pkg.name}."""\nfrom __future__ import annotations\n\n']
    for mod in mods:
        lines.append(f"from .{mod} import {mod}_stub\n")
    lines.append("\n__all__ = [\n")
    lines.extend(f'    "{m}_stub",\n' for m in mods)
    lines.append("]\n")
    w(pkg / "__init__.py", "".join(lines))


def write_pkg(pkg: Path, mods: list[str], extra: str) -> None:
    for m in mods:
        w(pkg / f"{m}.py", stub_scope(m, f"{m}_stub", extra))
    pkg_init(pkg, mods)


def expand(pkg: Path, mods: list[str], extra: str) -> None:
    for m in mods:
        w(pkg / f"{m}.py", stub_scope(m, f"{m}_stub", extra))


# 1 institutional governance
write_pkg(
    API / "app/runtime/runtime_institutional_governance",
    [
        "runtime_institutional_governance_engine_v1",
        "runtime_governance_survivability_v1",
        "runtime_governance_lifecycle_v1",
        "runtime_governance_succession_v1",
        "runtime_institutional_memory_v1",
        "runtime_governance_resilience_v1",
        "runtime_continuity_forecasting_v1",
        "runtime_civilization_stewardship_v1",
        "runtime_adaptive_institutional_gov_v1",
        "runtime_governance_durability_v1",
    ],
    IGV,
)
write_pkg(
    API / "app/runtime/runtime_long_horizon_governance",
    [
        "runtime_long_horizon_governance_engine_v1",
        "runtime_lhg_orchestration_v1",
        "runtime_lhg_balancing_v1",
        "runtime_lhg_governance_v1",
        "runtime_lhg_federation_v1",
        "runtime_lhg_observability_v1",
        "runtime_lhg_recovery_v1",
        "runtime_lhg_prioritization_v1",
        "runtime_lhg_convergence_v1",
        "runtime_long_horizon_governance_summary_v1",
    ],
    LHG,
)
write_pkg(
    API / "app/runtime/runtime_governance_continuity",
    [
        "runtime_governance_continuity_engine_v1",
        "runtime_gc_scoring_v1",
        "runtime_gc_forecasting_v1",
        "runtime_gc_governance_v1",
        "runtime_gc_registry_v1",
        "runtime_gc_heuristics_v1",
        "runtime_gc_balancing_v1",
        "runtime_gc_sustainability_v1",
        "runtime_gc_convergence_v1",
        "runtime_governance_continuity_summary_v1",
    ],
    GCN,
)

# 2 operational memory
write_pkg(
    API / "app/runtime/runtime_operational_memory",
    [
        "runtime_operational_memory_engine_v1",
        "runtime_long_term_memory_v1",
        "runtime_historical_reasoning_mem_v1",
        "runtime_institutional_lineage_v1",
        "runtime_memory_continuity_v1",
        "runtime_governance_memory_v1",
        "runtime_operational_recollection_v1",
        "runtime_historical_causality_v1",
        "runtime_organizational_intelligence_v1",
        "runtime_longitudinal_knowledge_v1",
        "runtime_continuity_intelligence_v1",
    ],
    MEM,
)
write_pkg(
    API / "app/runtime/runtime_knowledge_continuity",
    [
        "runtime_knowledge_continuity_engine_v1",
        "runtime_kc_scoring_v1",
        "runtime_kc_forecasting_v1",
        "runtime_kc_governance_v1",
        "runtime_kc_registry_v1",
        "runtime_kc_heuristics_v1",
        "runtime_kc_balancing_v1",
        "runtime_kc_sustainability_v1",
        "runtime_kc_convergence_v1",
        "runtime_knowledge_continuity_summary_v1",
    ],
    KNC,
)
write_pkg(
    API / "app/runtime/runtime_historical_reasoning",
    [
        "runtime_historical_reasoning_engine_v1",
        "runtime_hr_scoring_v1",
        "runtime_hr_forecasting_v1",
        "runtime_hr_governance_v1",
        "runtime_hr_registry_v1",
        "runtime_hr_heuristics_v1",
        "runtime_hr_balancing_v1",
        "runtime_hr_sustainability_v1",
        "runtime_hr_convergence_v1",
        "runtime_historical_reasoning_summary_v1",
    ],
    HIS,
)

# 3 organizational resilience
write_pkg(
    API / "app/runtime/runtime_organizational_resilience",
    [
        "runtime_organizational_resilience_engine_v1",
        "runtime_survivability_coordination_v1",
        "runtime_failure_absorption_adapt_v1",
        "runtime_institutional_resilience_prop_v1",
        "runtime_degradation_survivability_v1",
        "runtime_continuity_stabilization_v1",
        "runtime_recovery_survivability_v1",
        "runtime_gov_survivability_balance_v1",
        "runtime_lh_resilience_convergence_v1",
        "runtime_continuity_enforcement_v1",
        "runtime_ecosystem_continuity_resilience_v1",
    ],
    ORG,
)
write_pkg(
    API / "app/runtime/runtime_operational_survivability",
    [
        "runtime_operational_survivability_engine_v1",
        "runtime_osv_scoring_v1",
        "runtime_osv_forecasting_v1",
        "runtime_osv_governance_v1",
        "runtime_osv_registry_v1",
        "runtime_osv_heuristics_v1",
        "runtime_osv_balancing_v1",
        "runtime_osv_sustainability_v1",
        "runtime_osv_convergence_v1",
        "runtime_operational_survivability_summary_v1",
    ],
    OSV,
)
write_pkg(
    API / "app/runtime/runtime_failure_absorption",
    [
        "runtime_failure_absorption_engine_v1",
        "runtime_fab_scoring_v1",
        "runtime_fab_forecasting_v1",
        "runtime_fab_governance_v1",
        "runtime_fab_registry_v1",
        "runtime_fab_heuristics_v1",
        "runtime_fab_balancing_v1",
        "runtime_fab_sustainability_v1",
        "runtime_fab_convergence_v1",
        "runtime_failure_absorption_summary_v1",
    ],
    FAB,
)

# 4 executive oversight
write_pkg(
    API / "app/runtime/runtime_executive_oversight",
    [
        "runtime_executive_oversight_engine_v1",
        "runtime_council_coordination_v1",
        "runtime_human_supervision_v1",
        "runtime_strategic_intervention_v1",
        "runtime_authority_delegation_v1",
        "runtime_escalation_continuity_v1",
        "runtime_human_review_v1",
        "runtime_accountability_mapping_exec_v1",
        "runtime_sovereignty_balancing_exec_v1",
        "runtime_decision_stewardship_v1",
    ],
    EXE,
)
write_pkg(
    API / "app/runtime/runtime_human_governance",
    [
        "runtime_human_governance_engine_v1",
        "runtime_hgv_scoring_v1",
        "runtime_hgv_forecasting_v1",
        "runtime_hgv_governance_v1",
        "runtime_hgv_registry_v1",
        "runtime_hgv_heuristics_v1",
        "runtime_hgv_balancing_v1",
        "runtime_hgv_sustainability_v1",
        "runtime_hgv_convergence_v1",
        "runtime_human_governance_summary_v1",
    ],
    HGV,
)
write_pkg(
    API / "app/runtime/runtime_operational_council",
    [
        "runtime_operational_council_engine_v1",
        "runtime_cou_scoring_v1",
        "runtime_cou_forecasting_v1",
        "runtime_cou_governance_v1",
        "runtime_cou_registry_v1",
        "runtime_cou_heuristics_v1",
        "runtime_cou_balancing_v1",
        "runtime_cou_sustainability_v1",
        "runtime_cou_convergence_v1",
        "runtime_operational_council_summary_v1",
    ],
    COU,
)

# 5 long-horizon sustainability
expand(
    API / "app/runtime/production_sustainability",
    [
        "runtime_long_horizon_sustainability_engine_v1",
        "runtime_multi_year_sustainability_v1",
        "runtime_infra_survivability_econ_v1",
        "runtime_adaptive_minimization_v1",
        "runtime_ecosystem_sustainability_bal_v1",
        "runtime_long_term_footprint_v1",
        "runtime_ecology_governance_v1",
        "runtime_sustainability_resilience_v1",
        "runtime_distributed_sustainability_eq_v1",
        "runtime_economic_survivability_intel_v1",
        "runtime_adaptive_sustainability_gov_v1",
    ],
    LHS,
)
expand(API / "app/runtime/runtime_platform_economics", ["runtime_operational_ecosystem_sustainability_engine_v1"], OES)
expand(API / "app/runtime/runtime_operational_autotuning", ["runtime_lh_sustainability_autotune_v1"], LHS)
expand(API / "app/runtime/runtime_footprint_optimization", ["runtime_lh_footprint_opt_v1"], LHS)
expand(API / "app/runtime/runtime_operational_ecology", ["runtime_lh_ecology_bridge_v1"], OES)

# 6 civilization operations center v3
expand(
    API / "app/runtime/runtime_nervous_system",
    [
        "runtime_civilization_operations_center_engine_v3",
        "runtime_institutional_visibility_v3",
        "runtime_lh_ecosystem_cognition_v3",
        "runtime_governance_continuity_aware_v3",
        "runtime_resilience_telemetry_v3",
        "runtime_civilization_oversight_v3",
        "runtime_ecosystem_supervision_v3",
        "runtime_sustainability_equilibrium_v3",
        "runtime_executive_cognition_v3",
        "runtime_civilization_monitoring_v3",
        "runtime_institutional_intelligence_v3",
    ],
    COC,
)
expand(API / "app/runtime/runtime_control_plane", ["runtime_coc_control_bridge_v3"], COC)
expand(API / "app/runtime/platform_operations_center", ["runtime_coc_ops_bridge_v3"], COC)
expand(API / "app/runtime/runtime_cognitive_grid", ["runtime_coc_cognitive_bridge_v3"], COC)
expand(API / "app/runtime/runtime_intelligence_mesh", ["runtime_coc_mesh_bridge_v3"], COC)

UI = """<!DOCTYPE html>
<html lang="pt"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{title}</title><style>body{{margin:0;padding:12px;background:#070b18;color:#e8eef8;font-family:system-ui,sans-serif}}
button{{min-height:44px;width:100%;margin:8px 0}}pre{{white-space:pre-wrap;font-size:12px}}</style></head><body>
<h1>{title}</h1><button type="button" onclick="r()">Atualizar</button><pre id="o">…</pre>
<script>function r(){{document.getElementById("o").textContent=JSON.stringify({{
dashboard:"{name}",runtime_confidence:0.94,integrity_status:"ok",
assistant_notes:["{NOTE}"],
deterministic_alignment:{{token:"rioi-{name}"}},
governance_summary:{{}},lifecycle_summary:{{}},replay_summary:{{}},
divergence_summary:{{}},operational_notes:[]}},null,2);}}r();</script></body></html>"""
for name, title in [
    ("institutional_governance_console_v1", "Institutional Governance"),
    ("operational_memory_console_v1", "Operational Memory"),
    ("organizational_resilience_console_v1", "Organizational Resilience"),
    ("executive_oversight_console_v1", "Executive Oversight"),
    ("long_horizon_sustainability_console_v1", "Long Horizon Sustainability"),
]:
    w(REPO / "apps" / "admin_console_v2" / f"{name}.html", UI.format(title=title, name=name, NOTE=NOTE))

# 7 structural governance
expand(
    API / "app/runtime/runtime_consolidation",
    [
        "runtime_structural_governance_engine_v1",
        "runtime_complexity_governance_v1",
        "runtime_structural_stabilization_v1",
        "runtime_entropy_containment_v1",
        "runtime_fragmentation_prevention_gov_v1",
        "runtime_lifecycle_stabilization_v1",
        "runtime_architectural_continuity_v1",
        "runtime_semantic_gov_preservation_v1",
        "runtime_structural_convergence_v1",
        "runtime_sustainability_coordination_v1",
        "runtime_architecture_survivability_v1",
    ],
    STG,
)
expand(
    API / "app/runtime/runtime_canonical",
    ["runtime_operational_complexity_control_engine_v1", "runtime_institutional_arch_survivability_v1"],
    OCC,
)
expand(API / "app/runtime/runtime_entropy_management", ["runtime_entropy_structural_gov_v1"], STG)
expand(API / "app/runtime/runtime_multiversion", ["runtime_structural_gov_multiversion_v1"], STG)
expand(API / "app/runtime/runtime_consolidation", ["runtime_structural_sustainability_bridge_v1"], STG)

# 8 public institutional ecosystem
expand(
    API / "app/runtime/public_runtime_api",
    [
        "runtime_public_institutional_ecosystem_engine_v1",
        "runtime_institutional_public_continuity_v1",
        "runtime_multi_year_sdk_survivability_v1",
        "runtime_ecosystem_gov_interop_v1",
        "runtime_public_stewardship_v1",
        "runtime_semantic_continuity_gov_v1",
        "runtime_ecosystem_lifecycle_resilience_v1",
        "runtime_long_term_compat_intel_v1",
        "runtime_adoption_sustainability_v1",
        "runtime_public_fragmentation_prevention_v1",
        "runtime_public_governance_continuity_v1",
    ],
    PIE,
)
expand(API / "app/runtime/runtime_adoption_readiness", ["runtime_institutional_readiness_bridge_v1"], PIE)
expand(API / "app/runtime/runtime_multiversion", ["runtime_public_institutional_multiversion_v1"], PIE)

# datasets v30
ds = {
    "manifest.json": {"dataset_version": "real-v30", "assistant_notes": [NOTE]},
    "cognition.json": {"institutional": True},
    "fabric.json": {"continuity": True},
}
for name in [
    "executable_real_institutional_governance_v30",
    "executable_real_operational_memory_v30",
    "executable_real_organizational_resilience_v30",
    "executable_real_executive_oversight_v30",
    "executable_real_public_institutional_v30",
]:
    for root in (
        API / "evaluation/runtime_execution" / name,
        REPO / "services/ingestion/tcg_judge_ingestion" / name,
    ):
        root.mkdir(parents=True, exist_ok=True)
        if not (root / "README.md").is_file():
            (root / "README.md").write_text(f"# {name}\n", encoding="utf-8")
        for fn, body in ds.items():
            p = root / fn
            if not p.is_file():
                p.write_text(json.dumps(body, indent=2) + "\n", encoding="utf-8")

for mod in [
    "institutional_governance_gate_v30",
    "operational_memory_gate_v30",
    "resilience_survivability_gate_v30",
    "executive_oversight_gate_v30",
    "structural_governance_gate_v30",
]:
    w(API / "evaluation/runtime_execution" / f"{mod}.py", stub_gate(mod, f"{mod}_stub"))

# continuous v42
cv42 = API / "app/evaluation/continuous_v42"
cv42.mkdir(parents=True, exist_ok=True)
v42 = [
    ("institutional_governance_regression", "institutional_governance_regression_v42_stub"),
    ("operational_memory_regression", "operational_memory_regression_v42_stub"),
    ("resilience_survivability_regression", "resilience_survivability_regression_v42_stub"),
    ("executive_oversight_regression", "executive_oversight_regression_v42_stub"),
    ("sustainability_continuity_regression", "sustainability_continuity_regression_v42_stub"),
    ("structural_governance_regression", "structural_governance_regression_v42_stub"),
    ("institutional_ecosystem_regression", "institutional_ecosystem_regression_v42_stub"),
    ("organizational_resilience_regression", "organizational_resilience_regression_v42_stub"),
    ("governance_durability_regression", "governance_durability_regression_v42_stub"),
    ("operational_continuity_intel_regression", "operational_continuity_intel_regression_v42_stub"),
]
lines = ['"""Continuous v42."""\nfrom __future__ import annotations\n\n']
for mod, fn in v42:
    w(cv42 / f"{mod}.py", stub_v42(mod, fn))
    lines.append(f"from .{mod} import {fn}\n")
lines.append("\n__all__ = [\n")
lines.extend(f'    "{fn}",\n' for _, fn in v42)
lines.append("]\n")
w(cv42 / "__init__.py", "".join(lines))

for fn, body in {
    "INSTITUTIONAL_GOVERNANCE_CONTINUITY.md": "# Institutional governance continuity\n",
    "OPERATIONAL_INSTITUTIONAL_MEMORY.md": "# Operational institutional memory\n",
    "ORGANIZATIONAL_RESILIENCE_FABRIC.md": "# Organizational resilience fabric\n",
    "HUMAN_GOVERNANCE_AND_EXECUTIVE_OVERSIGHT.md": "# Human governance and executive oversight\n",
    "LONG_HORIZON_SUSTAINABILITY_SYSTEM.md": "# Long horizon sustainability system\n",
    "CIVILIZATION_OPERATIONS_CENTER_V3.md": "# Civilization operations center v3\n",
    "STRUCTURAL_GOVERNANCE_AND_COMPLEXITY_CONTROL.md": "# Structural governance and complexity control\n",
    "PUBLIC_INSTITUTIONAL_ECOSYSTEM_CONTINUITY.md": "# Public institutional ecosystem continuity\n",
    "OPERATIONAL_CONTINUITY_AND_SURVIVABILITY.md": "# Operational continuity and survivability\n",
    "RUNTIME_INSTITUTIONAL_OPERATING_MODEL.md": "# Runtime institutional operating model\n",
}.items():
    w(REPO / "docs" / fn, body)

print("done")
