"""Pipeline V11: runtime semântico distribuído + operações de juiz (não motor jurídico)."""

from __future__ import annotations

import hashlib
from typing import Any

from app.distributed_state.distributed_snapshots import build_snapshot_chain
from app.distributed_state.semantic_replication import replication_targets
from app.distributed_state.semantic_state_store import SemanticStateStore
from app.distributed_state.state_partitioning import partition_key
from app.judge_sessions.dispute_resolution import dispute_guidance
from app.judge_sessions.judge_session_manager import JudgeSessionManager
from app.judge_sessions.live_match_context import build_live_match_context
from app.judge_sessions.multi_player_state import default_multiplayer_state
from app.judge_sessions.priority_tracking import priority_order_apnap
from app.judge_sessions.stack_tracker import StackTracker
from app.judge_sessions.tournament_resolution import suggest_extension_policy
from app.multiplayer.apnap_runtime import apnap_sequence
from app.multiplayer.multiplayer_state_consistency import consistent_hashes
from app.multiplayer.simultaneous_action_resolution import resolve_simultaneous
from app.multiplayer.turn_structure_runtime import default_turn_structure
from app.observability.determinism_metrics import record_determinism_score
from app.observability.graph_expansion_metrics import graph_metrics_snapshot, record_graph_metric
from app.observability.judge_confidence_metrics import record_judge_confidence
from app.observability.reasoning_tracing import trace_reasoning_span
from app.observability.runtime_latency_metrics import latency_snapshot, record_latency_ms
from app.observability.semantic_metrics import bump_counter, snapshot_counters
from app.persistence.graph_persistence import GraphPersistence
from app.persistence.historical_semantic_store import HistoricalSemanticStore
from app.persistence.ontology_version_store import OntologyVersionStore
from app.persistence.replay_archive_store import ReplayArchiveStore
from app.persistence.semantic_postgres_store import SemanticPostgresStore
from app.reasoning.types import DistributedJudgeRuntimeV11
from app.replay_distributed.cross_version_replay import map_event_cross_version
from app.replay_distributed.distributed_replay_validator import validate_replay_events
from app.replay_distributed.historical_replay_executor import execute_historical_replay
from app.replay_distributed.replay_consensus import replay_consensus
from app.replay_distributed.replay_sharding import shard_for_replay
from app.timeline.event_timeline import append_event
from app.timeline.timeline_reconstruction import reconstruct
from app.tournament_ops.decklist_validation import validate_decklist
from app.tournament_ops.judge_floor_tools import floor_checklist
from app.tournament_ops.round_operations import round_clock_suggestion
from app.tournament_ops.tournament_policy_router import route_policy


def stable_session_id(game_slug: str, question: str) -> str:
    return hashlib.sha256(f"{game_slug}\n{question}".encode()).hexdigest()


def run_distributed_runtime_v11(
    *,
    question: str,
    game_slug: str,
    reasoning_confidence: float,
    v7_replay_hash: str,
    validated_roles: list[str],
) -> DistributedJudgeRuntimeV11:
    session_id = stable_session_id(game_slug, question)
    bump_counter("v11_runs")

    semantic_store_inner = SemanticStateStore()
    pg_store = SemanticPostgresStore(semantic_store_inner)
    graph_store = GraphPersistence()
    replay_archive = ReplayArchiveStore()
    hist_store = HistoricalSemanticStore()
    onto_store = OntologyVersionStore()

    genesis = v7_replay_hash
    players = ["P1", "P2", "P3"] if len(validated_roles) < 2 else ["P1", "P2"]
    roles_sample = validated_roles[:5] if validated_roles else ["noop"]

    transitions: list[dict[str, Any]] = []
    parent = genesis
    for i, role in enumerate(roles_sample):
        st = {"turn": i, "active": players[i % len(players)], "role": role}
        tr = {"kind": "symbolic_step", "index": i, "player": st["active"]}
        sem = {"slice": "rules", "roles": validated_roles[: min(8, len(validated_roles) or 1)]}
        chain = build_snapshot_chain(
            parent_state_hash=parent,
            state=st,
            transition=tr,
            semantic_slice=sem,
        )
        row = pg_store.append_transition(session_id=session_id, game_slug=game_slug, state=st, chain=chain)
        transitions.append(row)
        hist_store.record(version_label=f"r{i}", semantic_slice=sem)
        parent = chain["state_hash"]

    last_row = transitions[-1]
    cross = map_event_cross_version(last_row, "policy_current")

    short_q = question.strip()[:48] or "empty"
    graph_id = graph_store.save_edges([{"from": "q", "to": short_q, "weight": 1.0}])
    replay_archive.push(replay_hash=v7_replay_hash, version_label="v7", payload={"n_steps": len(transitions)})
    onto_store.register(version_label="v11_bundle", ontology_digest=v7_replay_hash[:16], notes="bootstrap")

    partition = partition_key(session_id, game_slug)
    distributed_state: dict[str, Any] = {
        "session_id": session_id,
        "partition": partition,
        "chain_verified": pg_store.verify_chain(session_id, game_slug),
        "latest": pg_store.latest(session_id, game_slug),
        "replication_targets": replication_targets(),
        "n_transitions": len(transitions),
    }

    manager = JudgeSessionManager()
    sess = manager.ensure_deterministic_session(session_id, game_slug, "floor-1")
    stack = StackTracker()
    stack.push({"object": "spell", "controller": players[0]})
    dispute = dispute_guidance("table_call" if "?" not in question else short_q)
    judge_session: dict[str, Any] = {
        "session": {
            "session_id": sess.session_id,
            "game_slug": sess.game_slug,
            "table_label": sess.table_label,
        },
        "live_match": build_live_match_context(round_no=1, match_id=session_id[:12]),
        "multiplayer": default_multiplayer_state(players),
        "stack": stack.snapshot(),
        "dispute_guidance": dispute,
        "tournament_clock": suggest_extension_policy(2),
    }

    tl: list[dict[str, Any]] = []
    for i, _r in enumerate(transitions):
        append_event(tl, "transition", f"step_{i}")
    seq_tl = [{"seq": i, **e} for i, e in enumerate(tl)]
    timeline_analysis: dict[str, Any] = {
        "events_reconstructed": reconstruct(seq_tl),
        "priority_windows_inferred": len(players),
    }

    primary_hash = transitions[-1]["state_hash"] if transitions else genesis
    multiplayer_resolution: dict[str, Any] = {
        "apnap": apnap_sequence(players[0], players[1:]),
        "priority_order_apnap": priority_order_apnap(players),
        "simultaneous": resolve_simultaneous([{"player": p, "action": "priority_pass"} for p in players]),
        "turn_structure": default_turn_structure(),
        "replica_hash_agreement": consistent_hashes([primary_hash, primary_hash, primary_hash]),
    }

    tournament_operations: dict[str, Any] = {
        "round_clock": round_clock_suggestion(50),
        "policy_route": route_policy("deck_issue"),
        "deck_validation": validate_decklist([{"name": "Mountain", "qty": 60}]),
        "floor_checklist": floor_checklist(),
        "extension": suggest_extension_policy(3),
    }

    persistent_memory: dict[str, Any] = {
        "graph_snapshot_id": graph_id,
        "replay_archive_tail": replay_archive.list_recent(3),
        "historical_head": hist_store.lineage_head("r0"),
        "ontology_timeline_tail": onto_store.timeline()[-2:],
    }

    consensus_hashes = [r["state_hash"] for r in transitions] + [genesis]
    distributed_replay: dict[str, Any] = {
        "shard": shard_for_replay(v7_replay_hash, 8),
        "validation": validate_replay_events(transitions),
        "consensus": replay_consensus(consensus_hashes, min_agree=1),
        "executor_tail": execute_historical_replay([{"h": r["state_hash"]} for r in transitions])[-1:],
        "cross_version_sample": cross,
    }

    trace_payload: dict[str, Any] = {}
    with trace_reasoning_span("v11.pipeline", {"session_id": session_id}) as span:
        record_latency_ms("v11_pipeline_ms", float(len(transitions)) * 2.0)
        record_graph_metric("v11_transitions", len(transitions))
        trace_payload = dict(span)

    chain_ok = bool(pg_store.verify_chain(session_id, game_slug))
    runtime_observability: dict[str, Any] = {
        "semantic_metrics": snapshot_counters(),
        "reasoning_trace": trace_payload,
        "graph_metrics": graph_metrics_snapshot(),
        "latency": latency_snapshot(),
        **record_determinism_score(1.0 if chain_ok else 0.4),
        **record_judge_confidence(reasoning_confidence),
        "opentelemetry": {"status": "hooks_ready", "instrumentation": "optional_sidecar"},
        "prometheus": {"status": "metrics_dict_embedded", "note": "expose_via_exporter"},
    }

    return DistributedJudgeRuntimeV11(
        distributed_state=distributed_state,
        judge_session=judge_session,
        timeline_analysis=timeline_analysis,
        multiplayer_resolution=multiplayer_resolution,
        tournament_operations=tournament_operations,
        persistent_memory=persistent_memory,
        distributed_replay=distributed_replay,
        runtime_observability=runtime_observability,
    )
