"""MTG multiplayer timing."""

from __future__ import annotations


def mtg_mp_timing_priority_shifts(n: int) -> dict[str, object]:
    return {"pressure": n > 6, "priority_passes": n}


def mtg_mp_timing_pressure(*, apnap_rounds: int) -> dict[str, object]:
    return mtg_mp_timing_priority_shifts(apnap_rounds)
