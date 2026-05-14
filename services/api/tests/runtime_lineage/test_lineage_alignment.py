from app.runtime.replay_governance_v2 import replay_lineage_alignment_stub


def test_replay_lineage_alignment() -> None:
    out = replay_lineage_alignment_stub("lr-1")
    assert "lineage_replay_awareness" in out
