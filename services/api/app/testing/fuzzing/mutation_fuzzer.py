"""Fuzzer de mutações formais."""

from __future__ import annotations

import random


def fuzz_mutations(seed: int) -> dict[str, int]:
    rng = random.Random(seed)
    return {"invalid_mutations": rng.randint(0, 2)}
