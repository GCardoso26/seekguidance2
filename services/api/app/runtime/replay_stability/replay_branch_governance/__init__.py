"""Governança de ramos de replay."""

from __future__ import annotations

from typing import Any


def replay_branch_governance_stub(branches: int, cap: int) -> dict[str, Any]:
    return {"capped": branches > cap, "branches": branches, "cap": cap}
