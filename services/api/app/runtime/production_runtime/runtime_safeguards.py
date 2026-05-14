"""Safeguards de runtime."""

from __future__ import annotations


def runtime_safeguard_flags(*, memory_high: bool, cpu_high: bool) -> dict[str, bool]:
    return {"throttle": memory_high or cpu_high, "memory_high": memory_high}
