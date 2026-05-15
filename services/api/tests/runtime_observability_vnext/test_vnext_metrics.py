"""Observabilidade vNext."""

from __future__ import annotations

from app.observability.live_runtime import runtime_trace_federation_stub


def test_trace_federation() -> None:
    t = runtime_trace_federation_stub("t1")
    assert isinstance(t, dict)
