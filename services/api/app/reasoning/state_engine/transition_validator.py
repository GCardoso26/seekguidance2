"""Validação de uma transição simbólica isolada."""

from __future__ import annotations

from typing import Any

from app.reasoning.state_engine.state_legality import validate_state_legality
from app.reasoning.state_engine.symbolic_state import SymbolicGameState


def validate_transition(
    before: SymbolicGameState,
    after: SymbolicGameState,
    interaction: str,
    game_slug: str,
) -> dict[str, Any]:
    leg_after = dict(validate_state_legality(after, game_slug))
    illegal = list(leg_after.get("illegal_conditions", []))
    ok = bool(leg_after.get("state_valid"))
    if interaction == "sba" and before.flags.get("replacement_unapplied"):
        ok = False
        illegal.append("sba_before_replacement_resolved")
    leg_after["illegal_conditions"] = illegal
    leg_after["state_valid"] = ok and leg_after.get("timing_legal", True) and leg_after.get("zone_consistency", True)
    return {"transition_valid": ok, "post_state_legality": leg_after}
