from app.runtime.runtime_real_pilot_v2.engine import runtime_real_pilot_engine_v2


def test_enroll() -> None:
    runtime_real_pilot_engine_v2("p", action="enroll", user_id="u1")
    r = runtime_real_pilot_engine_v2("p")
    assert r["enrolled"] >= 1
