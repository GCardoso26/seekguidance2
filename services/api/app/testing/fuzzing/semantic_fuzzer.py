"""Fuzzer de drift semântico sintético."""

from __future__ import annotations

import random


def fuzz_semantics(seed: int) -> dict[str, float]:
    rng = random.Random(seed)
    return {"semantic_drift": round(rng.random() * 0.2, 4)}
