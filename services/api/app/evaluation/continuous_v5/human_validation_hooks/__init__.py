"""Hooks de validação humana."""

from __future__ import annotations


def expert_review_hook_stub(case_id: str) -> dict[str, str]:
    return {"case_id": case_id, "status": "pending_expert"}
