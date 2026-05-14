"""Integridade de relatórios de torneio (campos mínimos)."""

from __future__ import annotations

from typing import Any


def tournament_integrity_flags(report: dict[str, Any]) -> dict[str, Any]:
    flags: list[str] = []
    if not report.get("event_id"):
        flags.append("missing_event_id")
    if not report.get("judge_panel"):
        flags.append("missing_judge_panel")
    return {"flags": flags, "ok": not flags}
