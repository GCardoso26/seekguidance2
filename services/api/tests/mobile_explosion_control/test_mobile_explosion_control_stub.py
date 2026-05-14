from app.mobile_runtime.explosion_control import mobile_explosion_caps_stub


def test_mobile_explosion_caps() -> None:
    assert mobile_explosion_caps_stub(20, 5)["pruned"] == 15
