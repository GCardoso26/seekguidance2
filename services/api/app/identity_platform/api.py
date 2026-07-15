"""Internal Identity Platform API — /runtime/judge/identity/*."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.identity_platform.domain.enums import ConsentPurpose, PlatformRole
from app.identity_platform.permissions import PermissionService, list_catalog
from app.identity_platform.services import (
    CompanyService,
    ConsentService,
    InvitationService,
    KycService,
    MembershipService,
    StoreOrgService,
    SubscriptionService,
    TrustService,
    UserService,
    WalletService,
)

router = APIRouter(prefix="/runtime/judge/identity", tags=["identity-platform"])


class CompanyCreateBody(BaseModel):
    cnpj: str
    legal_name: str
    trade_name: str | None = None
    state_registration: str | None = None
    address: dict[str, Any] | None = None


class CompanyPatchBody(BaseModel):
    cnpj: str | None = None
    legal_name: str | None = None
    trade_name: str | None = None
    state_registration: str | None = None
    address: dict[str, Any] | None = None


class InviteBody(BaseModel):
    email: str
    role: PlatformRole = PlatformRole.SELLER_STAFF


class ConsentBody(BaseModel):
    purpose: ConsentPurpose
    granted: bool = True
    version: str = Field(default="1", max_length=16)


@router.get("/me")
async def identity_me(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    me = await UserService(session).get_me(user_id)
    consents = await ConsentService(session).list_for_user(user_id)
    return {**me, "consents": consents}


@router.get("/companies/me")
async def company_me(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    company = await CompanyService(session).get_for_user(user_id)
    return {"company": company}


@router.post("/companies")
async def create_company(
    body: CompanyCreateBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    company = await CompanyService(session).create(
        user_id,
        cnpj=body.cnpj,
        legal_name=body.legal_name,
        trade_name=body.trade_name,
        state_registration=body.state_registration,
        address=body.address,
    )
    return {"company": company}


@router.post("/companies/ensure-from-store")
async def ensure_company_from_store(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    company = await CompanyService(session).ensure_from_store_owner(user_id)
    return {"company": company}


@router.patch("/companies/me")
async def patch_company(
    body: CompanyPatchBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    company = await CompanyService(session).patch(user_id, body.model_dump(exclude_none=True))
    return {"company": company}


@router.get("/stores/{store_id}/org")
async def store_org(
    store_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await StoreOrgService(session).get_org_view(store_id)


@router.get("/stores/{store_id}/memberships")
async def list_memberships(
    store_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    members = await MembershipService(session).list_for_store(user_id, store_id)
    return {"memberships": members}


@router.post("/stores/{store_id}/invitations")
async def invite_member(
    store_id: str,
    body: InviteBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    invitation = await InvitationService(session).invite(
        user_id, store_id, email=body.email, role=body.role
    )
    return {"invitation": invitation}


@router.post("/invitations/{token}/accept")
async def accept_invitation(
    token: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await InvitationService(session).accept(user_id, token)


@router.get("/permissions/check")
async def permission_check(
    permission: str,
    session: DbSession,
    store_id: str | None = None,
    company_id: str | None = None,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    allowed = await PermissionService(session).can(
        user_id, permission, store_id=store_id, company_id=company_id
    )
    return {"permission": permission, "allowed": allowed, "store_id": store_id, "company_id": company_id}


@router.get("/permissions/catalog")
async def permission_catalog(
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return {"roles": list_catalog()}


@router.get("/subscriptions/me")
async def subscriptions_me(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await SubscriptionService(session).list_for_user(user_id)


@router.get("/wallets/me")
async def wallets_me(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    try:
        return await WalletService(session).get_or_create_user_wallet(user_id)
    except Exception as exc:
        # Table may not exist until migration is applied
        raise HTTPException(503, f"Wallet schema not ready: {exc}") from exc


@router.get("/trust/store/{store_id}")
async def trust_store(
    store_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await TrustService(session).store_trust(store_id)


@router.get("/trust/buyer/me")
async def trust_buyer_me(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await TrustService(session).buyer_trust(user_id)


@router.get("/kyc/company/{company_id}")
async def kyc_company_get(
    company_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await KycService(session).get_case(company_id)


@router.post("/kyc/company/{company_id}")
async def kyc_company_submit(
    company_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    case = await KycService(session).submit_case(user_id, company_id)
    return {"case": case}


@router.get("/consents")
async def list_consents(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return {"consents": await ConsentService(session).list_for_user(user_id)}


@router.post("/consents")
async def set_consent(
    body: ConsentBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    record = await ConsentService(session).set_consent(
        user_id, body.purpose, body.granted, body.version
    )
    return {"consent": record}
