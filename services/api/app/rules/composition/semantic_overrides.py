"""Overrides formais (preferência por ordem estável)."""

from __future__ import annotations


def apply_override_chain(values: list[str]) -> str | None:
    return values[-1] if values else None
