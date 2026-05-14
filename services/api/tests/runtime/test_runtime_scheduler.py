"""Scheduler determinístico."""

from __future__ import annotations

from app.runtime.scheduler.deterministic_scheduler import schedule_roles


def test_stable_order() -> None:
    roles = ["z", "a", "m"]
    assert schedule_roles(roles, {}) == ["a", "m", "z"]
