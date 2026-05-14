"""Agenda de alto nível → scheduler determinístico."""

from __future__ import annotations

from typing import Any

from app.runtime.scheduler.deterministic_scheduler import schedule_roles


class RuntimeScheduler:
    def schedule(self, validated_roles: list[str], constraints: dict[str, Any] | None = None) -> list[str]:
        return schedule_roles(validated_roles, constraints or {})
