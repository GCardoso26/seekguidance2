from app.runtime.production_runtime import runtime_replay_repair_stub as production_replay_repair_stub
from app.runtime.replay_governance_v2 import runtime_replay_repair_stub as governance_replay_repair_stub


def test_governance_replay_repair() -> None:
    out = governance_replay_repair_stub("r1")
    assert out["replay_summary"]["layer"] == "runtime_replay_repair"


def test_production_replay_repair() -> None:
    out = production_replay_repair_stub("c1")
    assert out["governance"] == "production_runtime_v3_stub"
