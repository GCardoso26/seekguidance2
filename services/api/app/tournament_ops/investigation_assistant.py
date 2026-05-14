"""Assistência a investigações (procedural)."""

from __future__ import annotations


def investigation_steps() -> list[str]:
    return ["collect_statements", "review_replay_if_available", "consult_policy"]
