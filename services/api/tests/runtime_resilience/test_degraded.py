"""Resilience degraded mode flags."""

from app.runtime.runtime_resilience.events import degraded_status, mark_degraded


def test_degraded_flags() -> None:
    mark_degraded("redis", True)
    status = degraded_status()
    assert status.get("redis") is True
