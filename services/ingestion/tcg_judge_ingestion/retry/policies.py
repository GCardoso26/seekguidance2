"""Políticas de retry (timeouts, max tentativas)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RetryPolicy:
    max_attempts: int = 4
    per_host_rps: float = 1.0
    request_timeout_s: float = 120.0
