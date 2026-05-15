"""Atualiza __init__.py e cria testes sprint v5."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]


def merge_init(pkg: Path, pairs: list[tuple[str, str]]) -> None:
    init = pkg / "__init__.py"
    text = init.read_text(encoding="utf-8") if init.is_file() else ""
    if '"""' not in text[:80]:
        text = f'"""{pkg.name}."""\nfrom __future__ import annotations\n\n' + text
    all_start = text.find("__all__ = [")
    if all_start >= 0:
        all_end = text.find("]", all_start) + 1
        block = text[all_start:all_end]
        names = [line.strip().strip('",') for line in block.splitlines() if '"' in line]
    else:
        names = []
        text += "\n__all__ = [\n]\n"
        all_start = text.find("__all__ = [")
        all_end = text.find("]", all_start) + 1
        block = text[all_start:all_end]
    for mod, fn in pairs:
        imp = f"from .{mod} import {fn}\n"
        if imp not in text:
            insert_at = text.find("__all__")
            text = text[:insert_at] + imp + text[insert_at:]
        if fn not in names:
            names.append(fn)
    new_block = "__all__ = [\n" + "\n".join(f'    "{n}",' for n in sorted(set(names))) + "\n]\n"
    text = text[:all_start] + new_block + text[all_end:]
    init.write_text(text, encoding="utf-8")


PATCHES: list[tuple[Path, list[tuple[str, str]]]] = [
    (
        API / "app/runtime/production_runtime",
        [
            ("runtime_execution_orchestrator_v3", "runtime_execution_orchestrator_v3_stub"),
            ("runtime_execution_queue_v2", "runtime_execution_queue_v2_stub"),
            ("runtime_execution_scheduler_v3", "runtime_execution_scheduler_v3_stub"),
            ("runtime_execution_budget_controller_v2", "runtime_execution_budget_controller_v2_stub"),
            ("runtime_execution_state_machine_v2", "runtime_execution_state_machine_v2_stub"),
            ("runtime_execution_recovery_router_v2", "runtime_execution_recovery_router_v2_stub"),
            ("runtime_execution_degradation_router_v2", "runtime_execution_degradation_router_v2_stub"),
            ("runtime_execution_failure_domain_v2", "runtime_execution_failure_domain_v2_stub"),
            ("runtime_execution_stability_controller_v2", "runtime_execution_stability_controller_v2_stub"),
            ("runtime_execution_operational_summary_v2", "runtime_execution_operational_summary_v2_stub"),
        ],
    ),
    (
        API / "app/runtime/runtime_alignment",
        [("deterministic_replay_executor_v2", "deterministic_replay_executor_v2_stub")],
    ),
    (
        API / "app/runtime/persistent_replay_runtime",
        [
            ("replay_execution_checkpoint_runtime_v2", "replay_execution_checkpoint_runtime_v2_stub"),
            ("replay_execution_state_alignment_v2", "replay_execution_state_alignment_v2_stub"),
            ("replay_execution_temporal_locking_v2", "replay_execution_temporal_locking_v2_stub"),
            ("replay_execution_reconciliation_v2", "replay_execution_reconciliation_v2_stub"),
            ("replay_execution_branch_control_v2", "replay_execution_branch_control_v2_stub"),
            ("replay_execution_snapshot_runtime_v2", "replay_execution_snapshot_runtime_v2_stub"),
            ("replay_execution_integrity_runtime_v2", "replay_execution_integrity_runtime_v2_stub"),
            ("replay_execution_consistency_runtime_v2", "replay_execution_consistency_runtime_v2_stub"),
            ("replay_execution_operational_summary_v2", "replay_execution_operational_summary_v2_stub"),
            ("replay_snapshot_sqlite_runtime_v2", "replay_snapshot_sqlite_runtime_v2_stub"),
            ("replay_lineage_sqlite_runtime_v2", "replay_lineage_sqlite_runtime_v2_stub"),
            ("replay_integrity_sqlite_runtime_v2", "replay_integrity_sqlite_runtime_v2_stub"),
            ("replay_checkpoint_sqlite_runtime_v2", "replay_checkpoint_sqlite_runtime_v2_stub"),
            ("replay_archive_filesystem_runtime_v2", "replay_archive_filesystem_runtime_v2_stub"),
            ("replay_compaction_runtime_v3", "replay_compaction_runtime_v3_stub"),
            ("replay_gc_runtime_v3", "replay_gc_runtime_v3_stub"),
            ("replay_storage_rotation_runtime_v2", "replay_storage_rotation_runtime_v2_stub"),
            ("replay_storage_integrity_scanner_v3", "replay_storage_integrity_scanner_v3_stub"),
            ("replay_storage_operational_summary_v2", "replay_storage_operational_summary_v2_stub"),
        ],
    ),
    (
        API / "app/runtime/replay_federation",
        [
            ("federation_supervisor_runtime_v2", "federation_supervisor_runtime_v2_stub"),
            ("federation_node_health_runtime_v2", "federation_node_health_runtime_v2_stub"),
            ("federation_runtime_balancer_v2", "federation_runtime_balancer_v2_stub"),
            ("federation_runtime_failover_router_v2", "federation_runtime_failover_router_v2_stub"),
            ("federation_runtime_consensus_guard_v2", "federation_runtime_consensus_guard_v2_stub"),
            ("federation_runtime_execution_monitor_v2", "federation_runtime_execution_monitor_v2_stub"),
            ("federation_runtime_recovery_supervisor_v2", "federation_runtime_recovery_supervisor_v2_stub"),
            ("federation_runtime_shard_registry_v2", "federation_runtime_shard_registry_v2_stub"),
            ("federation_runtime_coordination_v2", "federation_runtime_coordination_v2_stub"),
            ("federation_runtime_operational_state_v2", "federation_runtime_operational_state_v2_stub"),
        ],
    ),
    (
        API / "app/mobile_runtime",
        [
            ("mobile_runtime_sync_engine_v4", "mobile_runtime_sync_engine_v4_stub"),
            ("mobile_runtime_delta_transport_v3", "mobile_runtime_delta_transport_v3_stub"),
            ("mobile_runtime_reconciliation_engine_v4", "mobile_runtime_reconciliation_engine_v4_stub"),
            ("mobile_runtime_retry_controller_v3", "mobile_runtime_retry_controller_v3_stub"),
            ("mobile_runtime_conflict_scoring_v2", "mobile_runtime_conflict_scoring_v2_stub"),
            ("mobile_runtime_failover_router_v2", "mobile_runtime_failover_router_v2_stub"),
            ("mobile_runtime_snapshot_sync_v3", "mobile_runtime_snapshot_sync_v3_stub"),
            ("mobile_runtime_checkpoint_transport_v2", "mobile_runtime_checkpoint_transport_v2_stub"),
            ("mobile_runtime_operational_sync_summary_v2", "mobile_runtime_operational_sync_summary_v2_stub"),
        ],
    ),
    (
        API / "app/offline_runtime",
        [("offline_runtime_queue_runtime_v2", "offline_runtime_queue_runtime_v2_stub")],
    ),
    (
        API / "app/api/openapi_runtime_real",
        [
            ("openapi_runtime_exporter_v2", "openapi_runtime_exporter_v2_stub"),
            ("openapi_runtime_diff_engine_v2", "openapi_runtime_diff_engine_v2_stub"),
            ("openapi_runtime_contract_guard_v2", "openapi_runtime_contract_guard_v2_stub"),
            ("openapi_runtime_schema_alignment_v2", "openapi_runtime_schema_alignment_v2_stub"),
            ("openapi_runtime_regression_v2", "openapi_runtime_regression_v2_stub"),
            ("openapi_runtime_snapshot_history_v2", "openapi_runtime_snapshot_history_v2_stub"),
            ("openapi_runtime_ci_enforcement_v2", "openapi_runtime_ci_enforcement_v2_stub"),
            ("runtime_contract_drift_detection_v2", "runtime_contract_drift_detection_v2_stub"),
            ("runtime_openapi_operational_summary_v2", "runtime_openapi_operational_summary_v2_stub"),
            ("ts_contract_runtime_alignment_v2", "ts_contract_runtime_alignment_v2_stub"),
        ],
    ),
    (
        API / "app/observability/runtime_exporters",
        [
            ("runtime_otel_connector_v3", "runtime_otel_connector_v3_stub"),
            ("runtime_prometheus_bridge_v3", "runtime_prometheus_bridge_v3_stub"),
            ("runtime_trace_persistence_v2", "runtime_trace_persistence_v2_stub"),
            ("replay_trace_storage_runtime_v2", "replay_trace_storage_runtime_v2_stub"),
            ("runtime_metrics_aggregation_v3", "runtime_metrics_aggregation_v3_stub"),
            ("runtime_slo_enforcement_v2", "runtime_slo_enforcement_v2_stub"),
            ("runtime_alert_router_v2", "runtime_alert_router_v2_stub"),
            ("runtime_incident_metrics_v2", "runtime_incident_metrics_v2_stub"),
            ("runtime_trace_alignment_v5", "runtime_trace_alignment_v5_stub"),
            ("runtime_observability_operational_summary_v2", "runtime_observability_operational_summary_v2_stub"),
        ],
    ),
    (
        API / "app/runtime/pilot_runtime",
        [
            ("pilot_runtime_deployment_readiness_v3", "pilot_runtime_deployment_readiness_v3_stub"),
            ("pilot_runtime_health_gates_v2", "pilot_runtime_health_gates_v2_stub"),
            ("pilot_runtime_execution_limits_v3", "pilot_runtime_execution_limits_v3_stub"),
            ("pilot_runtime_operational_scope_v2", "pilot_runtime_operational_scope_v2_stub"),
            ("pilot_runtime_dataset_controls_v2", "pilot_runtime_dataset_controls_v2_stub"),
            ("pilot_runtime_observability_bridge_v2", "pilot_runtime_observability_bridge_v2_stub"),
            ("pilot_runtime_recovery_controls_v2", "pilot_runtime_recovery_controls_v2_stub"),
            ("pilot_runtime_federation_scope_v2", "pilot_runtime_federation_scope_v2_stub"),
            ("pilot_runtime_mobile_scope_v3", "pilot_runtime_mobile_scope_v3_stub"),
            ("pilot_runtime_release_summary_v2", "pilot_runtime_release_summary_v2_stub"),
        ],
    ),
]

for pkg, pairs in PATCHES:
    if pkg.is_dir():
        merge_init(pkg, pairs)

# evaluation openapi_contract_validation
ocv = API / "evaluation/openapi_contract_validation"
ocv.mkdir(parents=True, exist_ok=True)
if not (ocv / "__init__.py").is_file():
    (ocv / "__init__.py").write_text(
        '"""OpenAPI contract validation."""\nfrom __future__ import annotations\n\n__all__ = []\n',
        encoding="utf-8",
    )

# tests
TESTS = {
    "runtime_execution_v5": (
        "app.runtime.production_runtime",
        "runtime_execution_orchestrator_v3_stub",
        "scope",
    ),
    "deterministic_replay_execution_v5": (
        "app.runtime.runtime_alignment",
        "deterministic_replay_executor_v2_stub",
        "replay-ref",
    ),
    "federation_supervision_v5": (
        "app.runtime.replay_federation",
        "federation_supervisor_runtime_v2_stub",
        "scope",
    ),
    "replay_persistence_v5": (
        "app.runtime.persistent_replay_runtime",
        "replay_snapshot_sqlite_runtime_v2_stub",
        "ref",
    ),
    "mobile_sync_operational_v5": (
        "app.mobile_runtime",
        "mobile_runtime_sync_engine_v4_stub",
        "device",
    ),
    "openapi_runtime_v5": (
        "app.api.openapi_runtime_real",
        "openapi_runtime_ci_enforcement_v2_stub",
        "run1",
    ),
    "runtime_observability_v5": (
        "app.observability.runtime_exporters",
        "runtime_otel_connector_v3_stub",
        "scope",
    ),
    "runtime_incident_management_v5": (
        "app.runtime.runtime_incident_management",
        "runtime_incident_registry_stub",
        "scope",
    ),
    "internal_tooling_v5": None,
    "pilot_deployment_v5": (
        "app.runtime.pilot_runtime",
        "pilot_runtime_deployment_readiness_v3_stub",
        "scope",
    ),
    "runtime_execution_gates_v4": (
        "evaluation.runtime_execution",
        "operational_execution_gate_v4_stub",
        "run",
    ),
    "continuous_v14": (
        "app.evaluation.continuous_v14",
        "runtime_execution_regression_v14_stub",
        "sig",
    ),
}

for dirname, spec in TESTS.items():
    td = API / "tests" / dirname
    td.mkdir(parents=True, exist_ok=True)
    fn = f"test_{dirname}_imports.py"
    p = td / fn
    if p.is_file():
        continue
    if spec is None:
        content = '''"""Internal tooling v5."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[4]


def test_runtime_scheduler_console_exists() -> None:
    assert (REPO / "apps" / "judge_console" / "runtime_scheduler_console.html").is_file()
'''
    else:
        mod, stub, arg = spec
        content = f'''"""{dirname} imports."""

from __future__ import annotations

from {mod} import {stub}


def test_{dirname}_payload() -> None:
    p = {stub}("{arg}")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
'''
    p.write_text(content, encoding="utf-8")

print("patched")
