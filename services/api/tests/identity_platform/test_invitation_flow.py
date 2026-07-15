"""Invitation service token shape (unit, no DB)."""

import secrets

from app.identity_platform.domain.enums import InvitationStatus, PlatformRole


def test_invitation_token_entropy():
    token = secrets.token_urlsafe(32)
    assert len(token) >= 32


def test_invitation_status_lifecycle():
    assert InvitationStatus.PENDING.value == "pending"
    assert InvitationStatus.ACCEPTED.value == "accepted"
    assert InvitationStatus.REVOKED.value == "revoked"
    assert InvitationStatus.EXPIRED.value == "expired"


def test_judge_role_value_for_invite():
    assert PlatformRole.SELLER_JUDGE.value == "SELLER_JUDGE"
    assert PlatformRole.SELLER_EVENT_MANAGER.value == "SELLER_EVENT_MANAGER"
