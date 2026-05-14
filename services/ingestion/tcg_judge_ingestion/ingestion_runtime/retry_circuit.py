"""Circuit breaker simples para falhas consecutivas."""

from __future__ import annotations


def circuit_state_after_failure(failures: int, *, open_threshold: int = 5) -> str:
    return "open" if failures >= open_threshold else "closed"
