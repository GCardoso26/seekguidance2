from app.runtime.explosion_control_v6 import mobile_replay_entropy_v2_stub, mobile_runtime_caps_v2_stub


def test_explosion_v6_stubs() -> None:
    assert mobile_replay_entropy_v2_stub(0.9)["replay_summary"]["clamped"] is True
    assert mobile_runtime_caps_v2_stub(4096)["branch_cap"] == 16
