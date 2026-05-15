"""replay_contract_stability_runtime."""

from __future__ import annotations

from typing import Any


def replay_contract_stability_runtime_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "compatibility_score": 0.88,
        "schema_drift_score": 0.05,
        "replay_runtime_alignment": 0.9,
        "mobile_contract_alignment": 0.87,
        "drift_summary": {"bounded": True},
        "missing_routes": [],
        "payload_mismatches": [],
        "assistant_notes": ["replay_contract_stability_runtime_stub: CI operacional OpenAPI ↔ TS."],
    }
