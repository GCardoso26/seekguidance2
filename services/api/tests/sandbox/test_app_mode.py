"""APP_MODE unit tests."""

from __future__ import annotations

from app.sandbox.mode import can_run_seed_demo, get_app_mode, is_production_mode, is_sandbox_elevatable


def test_default_mode_is_valid(monkeypatch) -> None:
    monkeypatch.setenv("APP_MODE", "sandbox")
    from app.core.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setattr(
        "app.sandbox.mode.get_settings",
        lambda: type("S", (), {"app_mode": "sandbox", "seed_demo_force": False})(),
    )
    assert get_app_mode() == "sandbox"
    assert is_sandbox_elevatable() is True
    assert can_run_seed_demo() is True


def test_production_fail_closed(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.sandbox.mode.get_settings",
        lambda: type("S", (), {"app_mode": "production", "seed_demo_force": True})(),
    )
    assert is_production_mode() is True
    assert is_sandbox_elevatable() is False
    assert can_run_seed_demo() is False


def test_beta_seed_requires_force(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.sandbox.mode.get_settings",
        lambda: type("S", (), {"app_mode": "beta", "seed_demo_force": False})(),
    )
    assert can_run_seed_demo() is False
    monkeypatch.setattr(
        "app.sandbox.mode.get_settings",
        lambda: type("S", (), {"app_mode": "beta", "seed_demo_force": True})(),
    )
    assert can_run_seed_demo() is True
