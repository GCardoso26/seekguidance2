"""Sistema de ranking — pontos, tiers e leaderboards."""

from __future__ import annotations

TIER_THRESHOLDS: list[tuple[str, int]] = [
    ("Legend", 3000),
    ("Mythic", 2500),
    ("Diamond", 2000),
    ("Platinum", 1500),
    ("Gold", 1000),
    ("Silver", 500),
    ("Bronze", 0),
]

BASE_POINTS_BY_PLACEMENT = [
    (1, 100),
    (2, 75),
    (3, 60),
    (4, 50),
    (8, 35),
    (16, 20),
    (32, 10),
    (999, 5),
]


def tier_from_points(points: int) -> tuple[str, int]:
    for tier, threshold in TIER_THRESHOLDS:
        if points >= threshold:
            span = 500 if tier != "Bronze" else 500
            above = points - threshold
            division = min(4, max(1, 4 - (above // (span // 4)) if span else 1))
            return tier, division
    return "Bronze", 1


def base_points_for_placement(placement: int, participants: int) -> int:
    base = 5
    for max_place, pts in BASE_POINTS_BY_PLACEMENT:
        if placement <= max_place:
            base = pts
            break
    multiplier = max(1.0, participants / 8.0)
    return int(base * multiplier)


def calculate_tournament_points(
    placement: int,
    participants: int,
    *,
    is_official: bool = False,
    is_competitive: bool = True,
    perfect_run: bool = False,
) -> int:
    pts = base_points_for_placement(placement, participants)
    if is_official:
        pts = int(pts * 1.10)
    if is_competitive:
        pts = int(pts * 1.05)
    if perfect_run and placement == 1:
        pts = int(pts * 1.15)
    return max(pts, 1)


def apply_decay(points: int, months_inactive: int) -> int:
    if months_inactive <= 0:
        return points
    decayed = points
    for _ in range(months_inactive):
        decayed = int(decayed * 0.95)
    tier, _ = tier_from_points(decayed)
    floor = next(t for t, th in TIER_THRESHOLDS if t == tier)[1] if False else 0
    for t_name, th in TIER_THRESHOLDS:
        if t_name == tier:
            floor = th
            break
    return max(decayed, floor)


def placement_from_standings(rank: int, status: str) -> int:
    if status == "dropped":
        return 999
    if status == "disqualified":
        return 1000
    return rank
