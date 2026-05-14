"""Diferença simbólica entre dois estados (legível)."""

from __future__ import annotations

from app.reasoning.state_engine.symbolic_state import SymbolicGameState


def state_diff(before: SymbolicGameState, after: SymbolicGameState) -> list[str]:
    out: list[str] = []
    all_z = set(before.zones) | set(after.zones)
    for z in sorted(all_z):
        b = before.zones.get(z, frozenset())
        a = after.zones.get(z, frozenset())
        if b != a:
            out.append(f"zone:{z}_changed")
    for k in sorted(set(before.flags) | set(after.flags)):
        if before.flags.get(k) != after.flags.get(k):
            out.append(f"flag:{k}_toggled")
    if before.state_id != after.state_id:
        out.append(f"state_id:{before.state_id}->{after.state_id}")
    return out
