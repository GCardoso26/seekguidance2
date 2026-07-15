"""UserService."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.identity_platform.adapters.rc1_user import load_user_identity
from app.identity_platform.domain import UserIdentity
from app.identity_platform.domain.enums import PlatformRole


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_me(self, user_id: str) -> dict[str, Any]:
        user = await load_user_identity(self._session, user_id)
        return {
            "user": _user_payload(user),
            "default_role": PlatformRole.BUYER.value,
            "note": "Roles come from Membership; there is no user.type flag.",
        }


def _user_payload(user: UserIdentity) -> dict[str, Any]:
    return {
        "id": user.id,
        "display_name": user.display_name,
        "email": user.email,
        "phone": user.phone,
        "account_status": user.account_status,
        "cpf_verified": user.cpf_verified,
        "address": user.address,
        "mfa_status": user.mfa_status.value,
        "passkey_status": user.passkey_status.value,
    }
