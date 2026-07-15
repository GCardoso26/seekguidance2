"""Unit tests — registration status machine."""

from __future__ import annotations

from app.tournament_platform.domain.enums import REGISTRATION_TRANSITIONS, RegistrationStatus
from app.tournament_platform.services.core_services import RegistrationService


def test_happy_path_transitions() -> None:
    svc = RegistrationService(session=None)  # type: ignore[arg-type]
    path = [
        RegistrationStatus.PENDING_PAYMENT,
        RegistrationStatus.PAID,
        RegistrationStatus.REGISTERED,
        RegistrationStatus.CONFIRMED,
        RegistrationStatus.CHECKED_IN,
        RegistrationStatus.PLAYING,
        RegistrationStatus.COMPLETED,
    ]
    for a, b in zip(path, path[1:], strict=False):
        assert svc.can_transition(a, b)


def test_cannot_skip_to_playing_from_pending() -> None:
    svc = RegistrationService(session=None)  # type: ignore[arg-type]
    assert not svc.can_transition(
        RegistrationStatus.PENDING_PAYMENT, RegistrationStatus.PLAYING
    )


def test_terminal_states() -> None:
    for st in (
        RegistrationStatus.COMPLETED,
        RegistrationStatus.NO_SHOW,
        RegistrationStatus.CANCELLED,
        RegistrationStatus.REFUNDED,
    ):
        assert REGISTRATION_TRANSITIONS[st] == frozenset()
