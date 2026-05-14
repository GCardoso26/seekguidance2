"""Pipeline semântico V6: objetos, causalidade, eventos, layers, equivalência, snapshots."""

from __future__ import annotations

from typing import Any

from app.reasoning.causal.causal_chain_builder import build_causal_chain_from_roles
from app.reasoning.continuous.effect_application import apply_ordered_continuous
from app.reasoning.continuous.timestamp_system import TimestampAssigner
from app.reasoning.equivalence.equivalent_state_merger import count_equivalent_groups
from app.reasoning.events.event_queue import EventQueue
from app.reasoning.events.gameplay_events import GameplayEvent
from app.reasoning.semantic_conflicts.semantic_conflict_detector import detect_semantic_conflicts
from app.reasoning.semantic_objects.continuous_effects import ContinuousEffect
from app.reasoning.semantic_objects.gameplay_object import GameplayObject
from app.reasoning.semantic_objects.object_identity import identity_continuity_record, lineage_for
from app.reasoning.semantic_objects.object_registry import ObjectRegistry
from app.reasoning.snapshots.transition_history import TransitionHistory
from app.reasoning.types import SemanticGameplayResolutionV6


def run_semantic_gameplay_v6(
    *,
    validated_roles: list[str],
    question: str,
    game_slug: str,
    v5_deterministic_confidence: float,
) -> SemanticGameplayResolutionV6:
    ql = (question or "").lower()
    causal_chain = build_causal_chain_from_roles(validated_roles, question)

    registry = ObjectRegistry()
    creature = GameplayObject(
        object_id="obj_creature_1",
        object_type="creature",
        controller="player_a",
        zone="battlefield",
        power=3,
        toughness=3,
        lineage_id=lineage_for("obj_creature_1"),
    )
    registry.register(creature)

    history = TransitionHistory()
    event_trace: list[str] = []
    queue = EventQueue(max_size=32)
    for step in causal_chain:
        ev_name = str(step.get("event", "Unknown"))
        caused = str(step.get("caused_by", "root"))
        queue.push(GameplayEvent(name=ev_name, caused_by=caused))
        event_trace.append(ev_name)
        history.append({"event": ev_name, "caused_by": caused})

    semantic_changes: list[dict[str, Any]] = []
    if "replacement" in validated_roles:
        semantic_changes.append({"object_id": creature.object_id, "change": "pending_replacement_frame"})
    if "sba" in validated_roles:
        semantic_changes.append({"object_id": "game", "change": "sba_sequence_evaluated"})
    if "layer" in validated_roles or "layer" in ql:
        semantic_changes.append({"object_id": creature.object_id, "change": "layer_recalc_scheduled"})

    ts = TimestampAssigner()
    ce_a = ContinuousEffect("ce_a", "power_toughness", creature.object_id, dependency_of=None)
    ce_b = ContinuousEffect("ce_b", "power_toughness", creature.object_id, dependency_of="ce_a")
    bindings = [(ce_a, ts.stamp()), (ce_b, ts.stamp())]
    applied = apply_ordered_continuous(bindings)
    layer_ordering = list(applied.get("application_order", []))

    layer_pairs: list[tuple[str, str | None]] = [("ce_a", None), ("ce_b", "ce_a")]
    if "two continuous" in ql or "two continuous effects" in ql:
        layer_pairs.append(("ce_dup", "ce_a"))
    ts_conflicts: list[tuple[int, int]] = []
    if "timestamp" in ql and "conflict" in ql:
        ts_conflicts.append((1, 1))
    sem_conf = detect_semantic_conflicts(
        layer_dependency_pairs=layer_pairs,
        timestamp_pairs_same_layer=ts_conflicts,
    )

    lineage_records: list[dict[str, str]] = []
    if "exile" in ql and "return" in ql:
        lineage_records.append(
            identity_continuity_record(lineage_for(creature.object_id), "battlefield", "exile", "flicker_or_ot_l")
        )
        lineage_records.append(
            identity_continuity_record(lineage_for(creature.object_id), "exile", "battlefield", "returns")
        )

    objs_a = registry.all_objects()
    merged_n, _counts = count_equivalent_groups([objs_a, list(objs_a)])

    det = v5_deterministic_confidence * (0.94 if not sem_conf else 0.72)
    det = max(0.05, min(0.99, det + 0.01 * len(layer_ordering)))

    return SemanticGameplayResolutionV6(
        causal_chain=causal_chain,
        semantic_state_changes=semantic_changes,
        continuous_effects_applied=list(applied.get("application_order", [])),
        layer_ordering=layer_ordering,
        equivalent_paths_merged=merged_n,
        object_lineage=lineage_records,
        deterministic_confidence=det,
        event_trace=event_trace,
        snapshots_n=len(history.as_list()) + 1,
        semantic_conflicts=sem_conf,
    )
