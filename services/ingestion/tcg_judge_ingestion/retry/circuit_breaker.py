"""Circuit breaker simples por chave (publisher / host)."""

from __future__ import annotations

from dataclasses import dataclass, field
from time import monotonic


@dataclass
class CircuitBreaker:
    failure_threshold: int = 5
    open_seconds: float = 30.0
    failures: int = 0
    opened_until: float = 0.0

    def allow(self) -> bool:
        return monotonic() >= self.opened_until

    def record_success(self) -> None:
        self.failures = 0
        self.opened_until = 0.0

    def record_failure(self) -> None:
        self.failures += 1
        if self.failures >= self.failure_threshold:
            self.opened_until = monotonic() + self.open_seconds
            self.failures = 0


@dataclass
class CircuitBreakerRegistry:
    _by_key: dict[str, CircuitBreaker] = field(default_factory=dict)

    def get(self, key: str) -> CircuitBreaker:
        if key not in self._by_key:
            self._by_key[key] = CircuitBreaker()
        return self._by_key[key]
