"""Alinhamento a SLOs operacionais (stub v2)."""

from __future__ import annotations

from typing import Any


def runtime_slo_alignment_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "slo_hints": {"latency_p99_stub_ms": 120},
        "assistant_notes": ["runtime_slo_alignment: juiz prioriza correção sobre velocidade."],
    }
