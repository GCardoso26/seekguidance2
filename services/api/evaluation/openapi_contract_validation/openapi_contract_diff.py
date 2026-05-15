"""openapi_contract_diff — validação OpenAPI ↔ TS."""

from __future__ import annotations

from typing import Any


def openapi_contract_diff_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "compatibility_score": 0.85,
        "drift_summary": {"bounded": True},
        "missing_routes": [],
        "payload_mismatches": [],
        "assistant_notes": ["openapi_contract_diff_stub: validação operacional; sem SDK auto-gen."],
    }
