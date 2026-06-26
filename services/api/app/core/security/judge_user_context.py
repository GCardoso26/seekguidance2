"""Contexto do user_id verificado via JWT Supabase (por request)."""

from __future__ import annotations

from contextvars import ContextVar

verified_judge_user_id: ContextVar[str | None] = ContextVar("verified_judge_user_id", default=None)
