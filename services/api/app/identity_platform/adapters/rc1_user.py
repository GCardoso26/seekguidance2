"""RC1 user adapter — player_profiles as UserIdentity."""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.identity_platform.domain import UserIdentity
from app.identity_platform.domain.enums import MfaStatus, PasskeyStatus
from app.players.store import ensure_player_profile


async def load_user_identity(session: AsyncSession, user_id: str) -> UserIdentity:
    await ensure_player_profile(session, user_id)
    row = (
        await session.execute(
            text(
                """
                SELECT id, display_name, username, account_status,
                       cpf_verified_at, avatar_url
                FROM tcg_judge.player_profiles
                WHERE id = :uid
                """
            ),
            {"uid": user_id},
        )
    ).mappings().first()

    extras = (
        await session.execute(
            text(
                """
                SELECT mfa_status, passkey_status, phone, email, address
                FROM tcg_judge.identity_users
                WHERE user_id = :uid
                """
            ),
            {"uid": user_id},
        )
    ).mappings().first()

    mfa = MfaStatus.DISABLED
    passkey = PasskeyStatus.DISABLED
    phone = None
    email = None
    address = None
    if extras:
        try:
            mfa = MfaStatus(str(extras.get("mfa_status") or "disabled"))
        except ValueError:
            mfa = MfaStatus.DISABLED
        try:
            passkey = PasskeyStatus(str(extras.get("passkey_status") or "disabled"))
        except ValueError:
            passkey = PasskeyStatus.DISABLED
        phone = extras.get("phone")
        email = extras.get("email")
        address = extras.get("address") if isinstance(extras.get("address"), dict) else None

    if not row:
        return UserIdentity(id=user_id, mfa_status=mfa, passkey_status=passkey)

    return UserIdentity(
        id=str(row["id"]),
        display_name=row.get("display_name") or row.get("username"),
        email=email,
        phone=phone,
        account_status=row.get("account_status"),
        cpf_verified=bool(row.get("cpf_verified_at")),
        address=address,
        mfa_status=mfa,
        passkey_status=passkey,
    )
