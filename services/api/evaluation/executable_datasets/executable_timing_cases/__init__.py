"""Casos executáveis de timing."""

from __future__ import annotations

from typing import Any


def executable_timing_case_stub(tags: list[str]) -> dict[str, Any]:
    return {"tags": tags, "timing_expectations": [{"ordering_tags": tags}]}
