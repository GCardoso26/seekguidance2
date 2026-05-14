"""Safeguards operacionais do solver."""

from __future__ import annotations

from typing import Any


def solver_runtime_safeguards(
    *,
    timeout_ms: int,
    recursion_depth: int,
    contradiction_budget: int,
    proof_compression_cap: int,
    emergency: bool,
) -> dict[str, Any]:
    return {
        "timeout_ms": timeout_ms,
        "recursion_cap": max(1, 32 - recursion_depth // 2),
        "contradiction_cap": contradiction_budget,
        "proof_compression_cap": proof_compression_cap,
        "emergency_fallback": emergency or timeout_ms < 50,
    }
