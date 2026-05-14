"""Testes do runtime distribuído V11."""

from __future__ import annotations

from typing import Any

from app.distributed_state.consistency_protocol import quorum_consistent
from app.distributed_state.distributed_snapshots import build_snapshot_chain
from app.distributed_state.semantic_replication import replication_targets
from app.distributed_state.semantic_state_store import SemanticStateStore
from app.evaluation.runtime_lab.semantic_consistency_lab import run_semantic_consistency_lab
from app.multiplayer.apnap_runtime import apnap_sequence
from app.persistence.semantic_postgres_store import SemanticPostgresStore
from app.reasoning.distributed_runtime_v11_pipeline import run_distributed_runtime_v11, stable_session_id
from app.replay_distributed.distributed_replay_validator import validate_replay_events
from app.replay_distributed.replay_consensus import replay_consensus
from app.timeline.timeline_reconstruction import reconstruct


def test_distributed_state_chain_verify() -> None:
    store = SemanticStateStore()
    parent = "genesis"
    for i in range(3):
        st = {"i": i}
        ch = build_snapshot_chain(
            parent_state_hash=parent,
            state=st,
            transition={"i": i},
            semantic_slice={"slice": "x"},
        )
        store.append_transition(session_id="sid", game_slug="mtg", state=st, chain=ch)
        parent = ch["state_hash"]
    assert store.verify_chain("sid", "mtg")


def test_replay_determinism_same_inputs_same_hashes() -> None:
    st = {"k": 1}
    a = build_snapshot_chain(
        parent_state_hash="p",
        state=st,
        transition={"t": 1},
        semantic_slice={"s": 1},
    )
    b = build_snapshot_chain(
        parent_state_hash="p",
        state=st,
        transition={"t": 1},
        semantic_slice={"s": 1},
    )
    assert a == b


def test_timeline_reconstruction_order() -> None:
    ev = [{"seq": 2, "e": "b"}, {"seq": 1, "e": "a"}]
    out = reconstruct(ev)
    assert [x["seq"] for x in out] == [1, 2]


def test_apnap_sequence_active_first() -> None:
    seq = apnap_sequence("P2", ["P3", "P1"])
    assert seq[0] == "P2"


def test_tournament_deck_validation_stub() -> None:
    from app.tournament_ops.decklist_validation import validate_decklist

    r = validate_decklist([{"name": "Forest", "qty": 60}])
    assert r["valid"] is True


def test_persistent_postgres_facade() -> None:
    inner = SemanticStateStore()
    pg = SemanticPostgresStore(inner)
    ch = build_snapshot_chain(
        parent_state_hash="",
        state={"a": 1},
        transition={"k": 1},
        semantic_slice={"s": 1},
    )
    pg.append_transition(session_id="x", game_slug="mtg", state={"a": 1}, chain=ch)
    assert pg.latest("x", "mtg") is not None


def test_state_replication_targets_nonempty() -> None:
    assert len(replication_targets()) >= 1


def test_cross_version_replay_consensus() -> None:
    h = ["a", "a", "b"]
    assert replay_consensus(h, min_agree=2)["consistent"] is True
    assert quorum_consistent(h, min_agree=2)


def test_distributed_replay_validator_accepts_chain() -> None:
    store = SemanticStateStore()
    parent = "g"
    rows: list[dict[str, Any]] = []
    for i in range(2):
        st = {"i": i}
        ch = build_snapshot_chain(
            parent_state_hash=parent,
            state=st,
            transition={"i": i},
            semantic_slice={"z": i},
        )
        rows.append(store.append_transition(session_id="z", game_slug="mtg", state=st, chain=ch))
        parent = ch["state_hash"]
    v = validate_replay_events(rows)
    assert v["valid"] is True


def test_v11_pipeline_smoke() -> None:
    v11 = run_distributed_runtime_v11(
        question="What happens on the stack?",
        game_slug="mtg",
        reasoning_confidence=0.7,
        v7_replay_hash="ab" * 32,
        validated_roles=["priority", "stack"],
    )
    d = v11.to_api_dict()
    assert set(d.keys()) >= {
        "distributed_state",
        "judge_session",
        "timeline_analysis",
        "multiplayer_resolution",
        "tournament_operations",
        "persistent_memory",
        "distributed_replay",
        "runtime_observability",
    }


def test_stable_session_id_deterministic() -> None:
    assert stable_session_id("mtg", "q1") == stable_session_id("mtg", "q1")


def test_semantic_consistency_lab() -> None:
    assert run_semantic_consistency_lab()["verified"] is True
