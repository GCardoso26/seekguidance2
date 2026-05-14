"""Verificação de legalidade de janelas de timing."""

from __future__ import annotations

from typing import Any


def all_windows_legal(windows: dict[str, bool]) -> dict[str, Any]:
    bad = [k for k, v in windows.items() if not v]
    return {"legal": len(bad) == 0, "violations": bad}
