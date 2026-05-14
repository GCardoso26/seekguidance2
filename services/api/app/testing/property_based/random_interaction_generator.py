"""Geração pseudo-aleatória de interações."""

from __future__ import annotations

import random

ROLES = ["replacement", "layer", "sba", "trigger", "priority"]


def generate_interaction(seed: int, max_roles: int = 6) -> list[str]:
    rng = random.Random(seed)
    n = rng.randint(1, max(1, max_roles))
    return [rng.choice(ROLES) for _ in range(n)]
