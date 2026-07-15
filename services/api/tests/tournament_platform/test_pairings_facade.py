"""Pairing format facade."""

from __future__ import annotations

import pytest
from app.tournament_platform.adapters.rc1_pairings import assert_format_or_raise, format_support
from app.tournament_platform.domain.enums import PairingFormat


def test_swiss_implemented() -> None:
    info = format_support(PairingFormat.SWISS)
    assert info["implemented"] is True
    assert info["via"] == "rc1_engine"


def test_double_elim_prepared() -> None:
    info = format_support(PairingFormat.DOUBLE_ELIMINATION)
    assert info["implemented"] is False
    assert info["status"] == "prepared"


def test_assert_raises_on_prepared() -> None:
    with pytest.raises(NotImplementedError):
        assert_format_or_raise(PairingFormat.COMMANDER_PODS)


def test_assert_swiss_ok() -> None:
    assert assert_format_or_raise("SWISS") == PairingFormat.SWISS
