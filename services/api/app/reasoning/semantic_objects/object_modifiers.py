"""Composição determinística de modificadores (cap explícito)."""

from __future__ import annotations

MAX_MODIFIERS = 24


def compose_modifiers(modifiers: list[str]) -> list[str]:
    return sorted({m.strip() for m in modifiers if m.strip()})[:MAX_MODIFIERS]
