"""Tracing + profiling smoke."""

from __future__ import annotations

from app.core.config import Settings
from app.observability.profiling import profile_region
from app.observability.tracing_runtime import (
    bind_trace,
    configure_otel_runtime,
    new_trace_id,
    reset_trace,
    should_sample,
)


def _s(**kwargs: object) -> Settings:
    base = {"database_url": "postgresql+asyncpg://x", "redis_url": "redis://x"}
    base.update(kwargs)
    return Settings(**base)  # type: ignore[arg-type]


def test_trace_bind() -> None:
    tid = new_trace_id()
    tok = bind_trace(tid)
    assert should_sample(_s(observability_trace_sample_rate=1.0)) is True
    reset_trace(tok)


def test_profile_region() -> None:
    with profile_region("x") as m:
        pass
    assert "elapsed_ms" in m


def test_configure_otel_runtime_disabled() -> None:
    s = _s(observability_otel_enabled=False)
    assert configure_otel_runtime(s)["otel"] == "disabled"


def test_configure_otel_runtime_enabled() -> None:
    s = _s(observability_otel_enabled=True, observability_otel_endpoint="http://localhost:4317")
    out = configure_otel_runtime(s)
    assert out["otel"] in {"sdk_present", "hooks_only"}
