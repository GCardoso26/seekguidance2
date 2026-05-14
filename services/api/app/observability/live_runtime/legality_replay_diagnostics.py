"""Diff legalidade replay (diagnóstico assistente)."""

from __future__ import annotations

from typing import Any


def legality_replay_diff_stub(a: dict[str, Any], b: dict[str, Any]) -> dict[str, Any]:
    keys = sorted(set(a) | set(b))
    diff = [k for k in keys if a.get(k) != b.get(k)]
    return {"diff_keys": diff, "assistant_safe": True}
