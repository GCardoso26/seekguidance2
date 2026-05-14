"""Constraints formais (bounded) para ordenação MTG — não substitui o CR completo."""

from __future__ import annotations

# (A, B): A deve aparecer antes de B na cadeia semântica quando ambos presentes.
MUST_PRECEDE: tuple[tuple[str, str], ...] = (
    ("event", "replacement"),
    ("replacement", "sba"),
    ("sba", "triggered"),
    ("triggered", "stack"),
    ("stack", "priority"),
)

# Papéis mutuamente exclusivos na mesma resolução mínima (exemplo pedagógico).
MUTEX_ROLES: tuple[tuple[str, str], ...] = ()

# Janela de timing → papéis que devem estar presentes para considerar legal em modo judge.
TIMING_REQUIRES: dict[str, tuple[str, ...]] = {
    "cleanup_step": ("sba",),
    "stack_resolution": ("stack", "priority"),
}

MAX_PROPAGATION_STEPS = 32
