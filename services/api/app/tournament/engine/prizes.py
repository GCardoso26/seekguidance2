"""Cálculo de premiação por rank (MVP)."""

from __future__ import annotations

from typing import Any

DEFAULT_DISTRIBUTION: list[tuple[int, int, float]] = [
    (1, 1, 0.40),
    (2, 2, 0.25),
    (3, 4, 0.15),
    (5, 8, 0.10),
]


def calculate_prizes(
    standings: list[dict[str, Any]],
    *,
    total_prize: float,
    currency: str = "BRL",
    distribution: list[tuple[int, int, float]] | None = None,
) -> list[dict[str, Any]]:
    """Distribuição fixa por rank. X-0/X-1 incluídos como metadado."""
    dist = distribution or DEFAULT_DISTRIBUTION
    results: list[dict[str, Any]] = []

    for i, s in enumerate(standings):
        rank = i + 1
        losses = int(s.get("matchLosses") or s.get("match_losses") or 0)
        record = f"{int(s.get('matchWins') or s.get('match_wins') or 0)}-{losses}"
        min_record = "X-0" if losses == 0 else "X-1" if losses == 1 else f"X-{losses}"

        pct = 0.0
        for start, end, share in dist:
            if start <= rank <= end:
                slots = end - start + 1
                pct = share / slots
                break

        amount = round(total_prize * pct, 2)
        results.append(
            {
                "rank": rank,
                "participantId": s.get("participantId") or s.get("participant_id"),
                "displayName": s.get("displayName") or s.get("display_name"),
                "record": record,
                "minRecord": min_record,
                "percentage": round(pct * 100, 2),
                "amount": amount,
                "currency": currency,
                "status": "pending" if amount > 0 else "none",
            }
        )
    return results
