"""Emissão de fases SSE do Judge durante retrieval/LLM (por request)."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from contextvars import ContextVar, Token

PhaseCallback = Callable[[str, str], Awaitable[None]]

_phase_cb: ContextVar[PhaseCallback | None] = ContextVar("judge_phase_cb", default=None)


def set_phase_callback(cb: PhaseCallback | None) -> Token:
    return _phase_cb.set(cb)


def reset_phase_callback(token: Token) -> None:
    _phase_cb.reset(token)


async def emit_judge_phase(phase: str, label: str) -> None:
    cb = _phase_cb.get()
    if cb is not None:
        await cb(phase, label)
