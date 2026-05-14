"""Fuzzer de conflitos de timing."""

from __future__ import annotations

import random


def fuzz_timing(seed: int) -> dict[str, int]:
    rng = random.Random(seed)
    return {"timing_conflicts": rng.randint(0, 3)}
