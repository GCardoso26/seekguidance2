"""Verificação contínua de integridade de storage (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import attach_storage_operational_fields, judge_mobile_core_payload


def storage_integrity_runtime_stub(scan_id: str) -> dict[str, Any]:
    base = judge_mobile_core_payload(
        replay_summary={"scan_id": scan_id, "pages_checked": 128},
        sync_hints=["Reportar apenas agregados até confirmar incidente."],
        deterministic_alignment={"scan_token": f"si-{scan_id}"},
        mobile_constraints={"cpu_budget_ms": 30},
        offline_confidence=0.73,
        assistant_notes=["Corrupção: isolar DB e oferecer recovery checkpoint."],
        lineage_replay_slice="si-v0",
    )
    return attach_storage_operational_fields(
        base,
        storage_status={"scanning": True},
        integrity_status={"last_error": None},
        replay_alignment={"verified_heads": 1},
        lineage_snapshot={"scan_seq": 1},
        offline_constraints=["Scan profundo pode ser adiado em baixa bateria"],
    )
