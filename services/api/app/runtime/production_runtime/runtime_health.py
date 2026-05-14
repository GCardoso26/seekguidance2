"""Health de runtime."""

from __future__ import annotations


def runtime_health_ping(ok: bool) -> dict[str, bool]:
    return {"ok": ok}
