"""payload_schema_drift — validação OpenAPI ↔ TS."""

from __future__ import annotations

from typing import Any


def payload_schema_drift_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "compatibility_score": 0.85,
        "drift_summary": {"bounded": True},
        "missing_routes": [],
        "payload_mismatches": [],
        "assistant_notes": ["payload_schema_drift_stub: validação operacional; sem SDK auto-gen."],
    }
