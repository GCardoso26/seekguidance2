"""Caps de runtime."""

from __future__ import annotations

from app.runtime.sandbox.runtime_caps import RuntimeCaps


def test_caps_defaults() -> None:
    c = RuntimeCaps()
    assert c.max_chain_explosion > 0
