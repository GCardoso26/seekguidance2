"""Sampling de trace em runtime."""

from __future__ import annotations

from app.core.config import Settings
from app.observability.tracing_runtime import should_sample


def runtime_sample_decision(settings: Settings) -> bool:
    return should_sample(settings)
