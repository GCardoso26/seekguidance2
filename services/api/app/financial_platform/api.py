"""Financial Platform API — /runtime/judge/financial-platform/* + /runtime/* reads."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, Query
from pydantic import BaseModel, Field

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.financial_platform.domain import JournalLine
from app.financial_platform.domain.enums import (
    EscrowStatus,
    GiftCardType,
    PayoutStatus,
    RefundStatus,
    TxnType,
)
from app.financial_platform.services import (
    CashbackService,
    ChargebackService,
    CommissionService,
    DashboardService,
    EscrowService,
    GiftCardService,
    LedgerService,
    MartService,
    PayoutService,
    PolicyService,
    RefundService,
    SettlementService,
    SplitService,
    StoreCreditService,
    TransactionService,
    WalletFacadeService,
)

router = APIRouter(tags=["financial-platform"])
fp = APIRouter(prefix="/runtime/judge/financial-platform", tags=["financial-platform"])


class JournalLineBody(BaseModel):
    account_code: str
    debit_cents: int = 0
    credit_cents: int = 0


class PostJournalBody(BaseModel):
    idempotency_key: str
    txn_type: TxnType
    lines: list[JournalLineBody]
    memo: str | None = None
    correlation_id: str | None = None


class RecordTxnBody(BaseModel):
    idempotency_key: str
    txn_type: TxnType
    amount_cents: int = Field(gt=0)
    subject_type: str | None = None
    subject_id: str | None = None
    order_ref: str | None = None


class SplitLineBody(BaseModel):
    beneficiary: str
    percent_bps: int = 0
    fixed_cents: int = 0


class SplitRuleBody(BaseModel):
    name: str
    scope_type: str = "store"
    scope_id: str | None = None
    lines: list[SplitLineBody]


class PayoutBody(BaseModel):
    store_id: str
    amount_cents: int = Field(gt=0)
    idempotency_key: str


class RefundBody(BaseModel):
    amount_cents: int = Field(gt=0)
    idempotency_key: str
    order_ref: str | None = None


class GiftIssueBody(BaseModel):
    amount_cents: int = Field(gt=0)
    card_type: GiftCardType = GiftCardType.MARKETPLACE
    store_id: str | None = None


class GiftRedeemBody(BaseModel):
    code: str
    amount_cents: int = Field(gt=0)


class PolicyBody(BaseModel):
    payout_delay_days: int | None = None
    payout_min_cents: int | None = None
    allow_wallet: bool | None = None
    allow_counter: bool | None = None
    allow_installments: bool | None = None


class EnsureAccountBody(BaseModel):
    code: str
    name: str
    owner_type: str
    owner_id: str
    account_type: str = "asset"


@fp.post("/journals")
async def post_journal(
    body: PostJournalBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    journal = await LedgerService(session).post_journal(
        idempotency_key=body.idempotency_key,
        txn_type=body.txn_type,
        actor_id=user_id,
        correlation_id=body.correlation_id,
        memo=body.memo,
        lines=[
            JournalLine(account_code=ln.account_code, debit_cents=ln.debit_cents, credit_cents=ln.credit_cents)
            for ln in body.lines
        ],
    )
    return {"journal": journal.to_dict()}


@fp.post("/accounts/ensure")
async def ensure_account(
    body: EnsureAccountBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.financial_platform.domain.enums import AccountType, OwnerType

    _require_user(x_judge_user_id)
    aid = await LedgerService(session).ensure_account(
        code=body.code,
        name=body.name,
        owner_type=OwnerType(body.owner_type),
        owner_id=body.owner_id,
        account_type=AccountType(body.account_type),
    )
    await session.commit()
    return {"account_id": aid, "code": body.code}


@fp.post("/transactions")
async def record_txn(
    body: RecordTxnBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await TransactionService(session).record(
        txn_type=body.txn_type,
        amount_cents=body.amount_cents,
        idempotency_key=body.idempotency_key,
        subject_type=body.subject_type,
        subject_id=body.subject_id or user_id,
        actor_id=user_id,
        order_ref=body.order_ref,
    )


@fp.post("/split-rules")
async def create_split(
    body: SplitRuleBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await SplitService(session).create_rule(
        name=body.name,
        scope_type=body.scope_type,
        scope_id=body.scope_id,
        lines=[ln.model_dump() for ln in body.lines],
    )


@fp.post("/payouts")
async def request_payout(
    body: PayoutBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await PayoutService(session).request(
        store_id=body.store_id,
        amount_cents=body.amount_cents,
        idempotency_key=body.idempotency_key,
    )


@fp.post("/payouts/{payout_id}/advance")
async def advance_payout(
    payout_id: str,
    session: DbSession,
    status: PayoutStatus = Query(...),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await PayoutService(session).advance(payout_id, status)


@fp.post("/refunds")
async def request_refund(
    body: RefundBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await RefundService(session).request(
        amount_cents=body.amount_cents,
        idempotency_key=body.idempotency_key,
        order_ref=body.order_ref,
        actor_id=user_id,
    )


@fp.post("/refunds/{refund_id}/advance")
async def advance_refund(
    refund_id: str,
    session: DbSession,
    status: RefundStatus = Query(...),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await RefundService(session).advance(refund_id, status)


@fp.post("/gift-cards")
async def issue_gift(
    body: GiftIssueBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await GiftCardService(session).issue(
        amount_cents=body.amount_cents,
        card_type=body.card_type,
        store_id=body.store_id,
    )


@fp.post("/gift-cards/redeem")
async def redeem_gift(
    body: GiftRedeemBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await GiftCardService(session).redeem(code=body.code, amount_cents=body.amount_cents)


@fp.post("/escrow")
async def create_escrow(
    session: DbSession,
    amount_cents: int = Query(gt=0),
    order_ref: str | None = Query(default=None),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await EscrowService(session).create(amount_cents=amount_cents, order_ref=order_ref)


@fp.post("/escrow/{escrow_id}/advance")
async def advance_escrow(
    escrow_id: str,
    session: DbSession,
    status: EscrowStatus = Query(...),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await EscrowService(session).transition(escrow_id, status)


@fp.put("/stores/{store_id}/policies")
async def upsert_policies(
    store_id: str,
    body: PolicyBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await PolicyService(session).upsert(store_id, body.model_dump(exclude_none=True))


@fp.post("/commission-rules")
async def commission_rule(
    session: DbSession,
    fee_type: str = Query(...),
    percent_bps: int = Query(ge=0),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await CommissionService(session).upsert_rule(fee_type=fee_type, percent_bps=percent_bps)


@fp.get("/chargebacks")
async def chargebacks(session: DbSession) -> dict[str, Any]:
    return await ChargebackService(session).list_all()


# --- read aliases ---


@router.get("/runtime/wallet")
async def runtime_wallet(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
    owner_type: str = Query(default="buyer"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    buckets = await WalletFacadeService(session).get_buckets(owner_type=owner_type, owner_id=user_id)
    return {"wallet": buckets.to_dict()}


@router.get("/runtime/financial-health")
async def runtime_health(
    session: DbSession,
    subject_type: str = Query(default="buyer"),
    subject_id: str | None = Query(default=None),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    uid = subject_id or _require_user(x_judge_user_id)
    return await MartService(session).financial_health(subject_type, uid)


@router.get("/runtime/cashback")
async def runtime_cashback(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await CashbackService(session).balance(user_id)


@router.get("/runtime/store-credit")
async def runtime_store_credit(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await StoreCreditService(session).balance(user_id)


@router.get("/runtime/payouts")
async def runtime_payouts(
    session: DbSession,
    store_id: str = Query(...),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return {"payouts": await PayoutService(session).list_for_store(store_id)}


@router.get("/runtime/transactions")
async def runtime_transactions(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
    subject_type: str = Query(default="buyer"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return {
        "transactions": await TransactionService(session).list_for_subject(subject_type, user_id)
    }


@router.get("/runtime/settlements")
async def runtime_settlements(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await SettlementService(session).list_all()


@router.get("/runtime/revenue")
async def runtime_revenue(session: DbSession) -> dict[str, Any]:
    return await MartService(session).revenue()


@router.get("/runtime/financial-dashboard")
async def runtime_financial_dashboard(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
    store_id: str | None = Query(default=None),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await DashboardService(session).financial_dashboard(user_id=user_id, store_id=store_id)


router.include_router(fp)
