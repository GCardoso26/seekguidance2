"""Controlos de custo runtime (stub)."""

from __future__ import annotations

from typing import Any


def aws_runtime_cost_controls_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["aws_runtime_cost_controls: caps declarativos; explainability-first."],
        "operational_hints": {"budget_alarm_optional": True},
        "replay_alignment": {"prune_safe": True},
        "deterministic_runtime_notes": ["Pruning não remove evidência exigível ao juiz."],
        "deployment_constraints": {"spot_optional": True},
        "runtime_confidence": 0.7,
    }
