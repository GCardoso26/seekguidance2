from app.runtime.runtime_real_pilot.engine import runtime_real_pilot_engine_v1


def test_pilot_enroll() -> None:
    runtime_real_pilot_engine_v1("p", action="enroll", user_id="u1", operator="op1")
    r = runtime_real_pilot_engine_v1("p")
    assert r["enrolled_users"] >= 1
