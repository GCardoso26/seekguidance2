"""Domain enums sanity."""

from __future__ import annotations

from app.tournament_platform.domain.enums import (
    IMPLEMENTED_PAIRING_FORMATS,
    PREPARED_PAIRING_FORMATS,
    JudgeStaffRole,
    PenaltyType,
    PrizeType,
)


def test_judge_roles() -> None:
    assert JudgeStaffRole.HEAD_JUDGE.value == "HEAD_JUDGE"
    assert JudgeStaffRole.EVENT_MANAGER in JudgeStaffRole


def test_penalty_and_prize_types() -> None:
    assert PenaltyType.DQ.value == "dq"
    assert PrizeType.STORE_CREDIT.value == "store_credit"


def test_pairing_sets_disjoint() -> None:
    assert IMPLEMENTED_PAIRING_FORMATS.isdisjoint(PREPARED_PAIRING_FORMATS)
