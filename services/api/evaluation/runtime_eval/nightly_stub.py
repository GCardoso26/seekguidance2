"""Smoke noturno (stub — orquestrar benchmarks reais no CI)."""

from __future__ import annotations

from typing import Any


def run_nightly_regression_stub() -> dict[str, Any]:
    return {"nightly": "stub", "suites": ["retrieval", "reasoning", "replay"], "status": "ok"}
