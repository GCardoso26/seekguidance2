"""FAB — combat chain (runtime local)."""

from __future__ import annotations

from app.games.hardening_v3.fab_reaction_runtime import fab_reaction_recursion_stub


def fab_combat_runtime_stub(depth: int) -> dict[str, object]:
    return fab_reaction_recursion_stub(depth)
