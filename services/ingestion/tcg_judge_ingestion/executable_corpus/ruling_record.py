"""Registo de ruling executável (expectativas para runtime)."""

from __future__ import annotations

from typing import Any


def build_executable_ruling_record(
    ruling_id: str,
    *,
    legality_expectations: list[str],
    timing_expectations: list[str],
    replay_expectations: list[str],
    deterministic_paths: list[str],
    contradiction_expectations: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "ruling_id": ruling_id,
        "legality_expectations": legality_expectations,
        "timing_expectations": timing_expectations,
        "replay_expectations": replay_expectations,
        "deterministic_path_expectations": deterministic_paths,
        "contradiction_expectations": contradiction_expectations or [],
        "executable": True,
        "assistant_note": "Expectativas curadas; não substituem o CR oficial.",
    }
