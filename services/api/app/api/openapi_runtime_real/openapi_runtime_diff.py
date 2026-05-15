"""OpenAPI real — openapi_runtime_diff"""

from __future__ import annotations

from typing import Any


def openapi_runtime_diff_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["openapi_runtime_diff_stub: execução operacional; explainability-first."],
        "deterministic_alignment": {"token": f"op-{scope}"},
        "replay_governance_scores": {"nominal": True},
        "lineage_hints": {},
        "mobile_runtime_hints": {},
    }
