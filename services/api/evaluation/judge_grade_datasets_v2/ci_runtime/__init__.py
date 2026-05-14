"""Runtime CI judge-grade (orquestração de suites)."""

from __future__ import annotations

from typing import Any


def ci_evaluation_bundle_stub(*, suite: str, manifest_ids: list[str]) -> dict[str, Any]:
    return {
        "suite": suite,
        "manifests": manifest_ids,
        "assistant_notes": ["Judge assistant: CI valida consistência, não substitui juiz de mesa."],
        "replay_consistency_governance": True,
    }
