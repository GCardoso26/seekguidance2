"""Tracking de políticas legacy."""

from __future__ import annotations


def legacy_policy_stub(name: str) -> dict[str, str]:
    return {"name": name, "deprecated": "unknown"}
