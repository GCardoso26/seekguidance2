"""Motor de transição: papéis de interação → evolução simbólica de estado."""

from __future__ import annotations

from copy import deepcopy

from app.reasoning.state_engine.symbolic_state import SymbolicGameState


def initial_symbolic_state(question: str, game_slug: str) -> SymbolicGameState:
    q = (question or "").lower()
    flags: dict[str, bool] = {}
    if "replacement" in q:
        flags["replacement_unapplied"] = True
    if "sba" in q or "state-based" in q:
        flags["sba_pending"] = True
    zones = {
        "STACK": frozenset(),
        "BATTLEFIELD": frozenset({"OBJ_ABSTRACT_1"}),
        "HAND": frozenset(),
    }
    sid = "GameState_0"
    if "cleanup" in q:
        sid = "GameState_cleanup_0"
    return SymbolicGameState(state_id=sid, zones=zones, flags=flags, meta={"game": game_slug})


def apply_role_transition(state: SymbolicGameState, role: str, step_idx: int) -> SymbolicGameState:
    nxt = deepcopy(state)
    nxt.state_id = f"GameState_{step_idx + 1}"
    z = dict(nxt.zones)
    if role == "replacement":
        nxt.flags["replacement_unapplied"] = False
        nxt.flags["event_modified"] = True
        z["STACK"] = z.get("STACK", frozenset()) | frozenset({"PENDING_REPLACEMENT_FRAME"})
    elif role == "sba":
        nxt.flags["sba_pending"] = False
        z["STACK"] = z.get("STACK", frozenset()) - frozenset({"PENDING_REPLACEMENT_FRAME"})
    elif role == "triggered":
        z["STACK"] = z.get("STACK", frozenset()) | frozenset({f"TRIG_OBJ_{step_idx}"})
    elif role == "stack":
        z["STACK"] = frozenset({x for x in z.get("STACK", frozenset()) if not str(x).startswith("TRIG_")}) or frozenset(
            {"RESOLVING"}
        )
    elif role == "priority":
        nxt.flags["priority_open"] = True
    elif role == "event":
        nxt.flags.setdefault("event_identified", True)
    nxt.zones = {k: frozenset(v) for k, v in z.items()}
    return nxt


def evolve_along_roles(
    roles: list[str],
    question: str,
    game_slug: str,
    *,
    max_steps: int = 16,
) -> tuple[list[SymbolicGameState], list[dict[str, str]]]:
    states: list[SymbolicGameState] = [initial_symbolic_state(question, game_slug)]
    transitions: list[dict[str, str]] = []
    for i, role in enumerate(roles[:max_steps]):
        cur = states[-1]
        nxt = apply_role_transition(cur, role, i)
        transitions.append(
            {
                "from_state": cur.state_id,
                "interaction": role,
                "to_state": nxt.state_id,
            }
        )
        states.append(nxt)
    return states, transitions
