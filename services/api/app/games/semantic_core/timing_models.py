"""Modelos de timing abstractos."""

from __future__ import annotations

from typing import Literal

TimingPhase = Literal["open_window", "resolve_batch", "cleanup", "unknown"]
