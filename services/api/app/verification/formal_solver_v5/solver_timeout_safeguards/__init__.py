"""Timeouts e orçamentos do solver."""

from __future__ import annotations

from typing import Any


def solver_timeout_safeguards_v5_payload(timeout_ms: int, used_ms: int) -> dict[str, Any]:
    return {
        "timeout_ms": timeout_ms,
        "used_ms": used_ms,
        "legality_reasoning": ["Execução interrompida por orçamento com explicação residual."],
        "proof_steps": [{"step": 1, "action": "watchdog"}],
        "assistant_notes": ["Timeouts preservam determinismo operacional do assistente."],
        "safeguard_triggered": used_ms > timeout_ms,
    }
