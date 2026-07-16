"""Sandbox entitlements."""

from __future__ import annotations

from app.sandbox.entitlements import is_sandbox_admin, sandbox_status_payload


def test_production_never_elevates(monkeypatch) -> None:
    monkeypatch.setattr("app.sandbox.entitlements.is_sandbox_elevatable", lambda: False)
    assert is_sandbox_admin("admin@test.com", "u1") is False
    payload = sandbox_status_payload(email="admin@test.com", user_id="u1")
    # mode still read from settings — elevated must be false via is_sandbox_admin
    assert payload["elevated"] is False


def test_sandbox_allowlist(monkeypatch) -> None:
    monkeypatch.setattr("app.sandbox.entitlements.is_sandbox_elevatable", lambda: True)
    monkeypatch.setattr(
        "app.sandbox.entitlements.get_settings",
        lambda: type("S", (), {"sandbox_admin_emails": "admin@judge.test"})(),
    )
    assert is_sandbox_admin("admin@judge.test", "x") is True
    assert is_sandbox_admin("other@judge.test", "x") is False


def test_sandbox_empty_allowlist_elevates_authed(monkeypatch) -> None:
    monkeypatch.setattr("app.sandbox.entitlements.is_sandbox_elevatable", lambda: True)
    monkeypatch.setattr(
        "app.sandbox.entitlements.get_settings",
        lambda: type("S", (), {"sandbox_admin_emails": ""})(),
    )
    assert is_sandbox_admin(None, "user-1") is True
    assert is_sandbox_admin(None, None) is False
