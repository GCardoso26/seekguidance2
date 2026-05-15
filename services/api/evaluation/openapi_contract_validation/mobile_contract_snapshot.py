"""mobile_contract_snapshot — validação OpenAPI ↔ TS."""

from __future__ import annotations

from typing import Any


def mobile_contract_snapshot_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "compatibility_score": 0.85,
        "drift_summary": {"bounded": True},
        "missing_routes": [],
        "payload_mismatches": [],
        "assistant_notes": ["mobile_contract_snapshot_stub: validação operacional; sem SDK auto-gen."],
    }
