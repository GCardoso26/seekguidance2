"""MTG — APNAP runtime explícito."""

from __future__ import annotations

from app.games.hardening_v3.mtg_multiplayer_runtime import mtg_apnap_loop_stub


def mtg_apnap_runtime_stub(turns: int) -> dict[str, object]:
    return mtg_apnap_loop_stub(turns)
