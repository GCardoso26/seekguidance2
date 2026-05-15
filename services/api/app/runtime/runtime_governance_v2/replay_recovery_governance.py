"""Governança de recuperação de replay (stub v2)."""

from __future__ import annotations

from typing import Any


def replay_recovery_governance_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "recovery_plan_hints": {"checkpoint_only": True},
        "assistant_notes": ["replay_recovery_governance: sem replay mutável opaco."],
    }
