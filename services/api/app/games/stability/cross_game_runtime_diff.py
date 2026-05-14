"""Diff declarativo entre runtimes de jogos (metadados)."""

from __future__ import annotations

from typing import Any


def runtime_diff_report(a: dict[str, Any], b: dict[str, Any]) -> dict[str, Any]:
    keys = sorted(set(a) | set(b))
    diff = [k for k in keys if a.get(k) != b.get(k)]
    return {"diff_keys": diff, "count": len(diff)}
