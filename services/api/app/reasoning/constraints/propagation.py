"""Propagação bounded de efeitos de precedência (rótulos simbólicos)."""

from __future__ import annotations


def build_propagation_chain(ordered_roles: list[str], *, max_steps: int) -> list[str]:
    out: list[str] = []
    for r in ordered_roles:
        if r == "event":
            out.append("base_game_event_identified")
        elif r == "replacement" or r == "replacement_like":
            out.extend(["replacement_effect_applied", "event_modified"])
        elif r == "sba" or r == "state_check":
            out.append("SBA_checked_after_replacement_processing")
        elif r == "triggered":
            out.append("trigger_window_changed")
        elif r == "stack" or r == "chain_resolution" or r == "queue_resolution":
            out.append("stack_resolution_order_applied")
        elif r == "priority":
            out.append("priority_window_enforced")
        elif r == "layer":
            out.append("layer_dependency_evaluated")
        elif r in ("segoc", "segoc_ordering"):
            out.append("SEGOC_ordering_applied")
        elif r == "chain_build":
            out.append("chain_links_built")
        elif r == "simultaneous_effects":
            out.append("simultaneous_effects_ordered")
        else:
            out.append(f"propagated:{r}")
        if len(out) >= max_steps:
            break
    return out[:max_steps]
