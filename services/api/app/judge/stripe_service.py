"""Stripe — clientes, subscrições e persistência Postgres."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import structlog
from app.core.config import Settings, get_settings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import stripe

logger = structlog.get_logger(__name__)

TIER_FROM_PRICE: dict[str, str] = {}


def _init_stripe(settings: Settings) -> None:
    if settings.stripe_secret_key:
        stripe.api_key = settings.stripe_secret_key


def resolve_price_id(settings: Settings, price_key: str) -> str | None:
    """Aceita price_xxx direto ou alias monthly_spike / annual_team / monthly_pro."""
    if price_key.startswith("price_"):
        return price_key
    mapping = {
        "monthly_spike": settings.stripe_price_monthly_spike,
        "annual_spike": settings.stripe_price_annual_spike,
        "monthly_pro": settings.stripe_price_monthly_spike,
        "annual_pro": settings.stripe_price_annual_spike,
        "monthly_team": settings.stripe_price_monthly_team,
        "annual_team": settings.stripe_price_annual_team,
    }
    return mapping.get(price_key)


def tier_from_price_id(settings: Settings, price_id: str) -> str:
    if price_id in (
        settings.stripe_price_monthly_team,
        settings.stripe_price_annual_team,
    ):
        return "team"
    return "spike"


def stripe_enabled(settings: Settings | None = None) -> bool:
    cfg = settings or get_settings()
    return bool(cfg.stripe_secret_key and cfg.stripe_webhook_secret)


async def ensure_judge_profile(db: AsyncSession, user_id: str) -> None:
    await db.execute(
        text(
            """
            INSERT INTO tcg_judge.judge_profiles (id, role)
            VALUES (:id, 'player')
            ON CONFLICT (id) DO NOTHING
            """
        ),
        {"id": user_id},
    )


async def get_subscription_row(db: AsyncSession, user_id: str) -> dict[str, Any] | None:
    row = (
        await db.execute(
            text(
                """
                SELECT id, user_id, stripe_customer_id, stripe_subscription_id,
                       stripe_price_id, tier::text AS tier, status::text AS status,
                       current_period_start, current_period_end,
                       cancel_at_period_end, canceled_at, trial_start, trial_end
                FROM tcg_judge.subscriptions
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT 1
                """
            ),
            {"user_id": user_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def get_or_create_customer(
    db: AsyncSession,
    user_id: str,
    email: str | None,
    name: str | None,
) -> str:
    settings = get_settings()
    _init_stripe(settings)
    await ensure_judge_profile(db, user_id)
    row = await get_subscription_row(db, user_id)
    if row and row.get("stripe_customer_id"):
        return str(row["stripe_customer_id"])

    customer = stripe.Customer.create(
        email=email or None,
        name=name or email,
        metadata={"user_id": user_id},
    )

    if row:
        await db.execute(
            text(
                """
                UPDATE tcg_judge.subscriptions
                SET stripe_customer_id = :cid, updated_at = NOW()
                WHERE user_id = :user_id
                """
            ),
            {"cid": customer.id, "user_id": user_id},
        )
    else:
        await db.execute(
            text(
                """
                INSERT INTO tcg_judge.subscriptions (user_id, stripe_customer_id, tier, status)
                VALUES (:user_id, :cid, 'free', 'incomplete')
                """
            ),
            {"user_id": user_id, "cid": customer.id},
        )
    await db.commit()
    return customer.id


def free_features() -> dict[str, bool]:
    return {
        "deck_builder": True,
        "basic_analytics": True,
        "tournament_join": True,
        "community_support": True,
        "advanced_analytics": False,
        "deck_export": False,
        "tournament_creation": False,
        "team_management": False,
        "priority_support": False,
        "custom_branding": False,
        "api_access": False,
    }


def features_for_tier(tier: str) -> dict[str, bool]:
    features = free_features()
    if tier in ("spike", "team", "pro"):
        features.update(
            {
                "advanced_analytics": True,
                "deck_export": True,
                "tournament_creation": True,
                "priority_support": True,
            }
        )
    if tier == "team":
        features.update(
            {
                "team_management": True,
                "custom_branding": True,
                "api_access": True,
            }
        )
    return features


def _ts(value: int | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromtimestamp(value, tz=UTC)


async def upsert_subscription(
    db: AsyncSession,
    *,
    user_id: str,
    stripe_customer_id: str | None,
    stripe_subscription_id: str,
    stripe_price_id: str | None,
    status: str,
    tier: str,
    current_period_start: int | None,
    current_period_end: int | None,
    cancel_at_period_end: bool = False,
    trial_start: int | None = None,
    trial_end: int | None = None,
) -> None:
    await ensure_judge_profile(db, user_id)
    await db.execute(
        text(
            """
            INSERT INTO tcg_judge.subscriptions (
              user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
              tier, status, current_period_start, current_period_end,
              cancel_at_period_end, trial_start, trial_end
            ) VALUES (
              :user_id, :stripe_customer_id, :stripe_subscription_id, :stripe_price_id,
              CAST(:tier AS tcg_judge.subscription_tier),
              CAST(:status AS tcg_judge.subscription_status),
              :current_period_start, :current_period_end,
              :cancel_at_period_end, :trial_start, :trial_end
            )
            ON CONFLICT (user_id) DO UPDATE SET
              stripe_customer_id = EXCLUDED.stripe_customer_id,
              stripe_subscription_id = EXCLUDED.stripe_subscription_id,
              stripe_price_id = EXCLUDED.stripe_price_id,
              tier = EXCLUDED.tier,
              status = EXCLUDED.status,
              current_period_start = EXCLUDED.current_period_start,
              current_period_end = EXCLUDED.current_period_end,
              cancel_at_period_end = EXCLUDED.cancel_at_period_end,
              trial_start = EXCLUDED.trial_start,
              trial_end = EXCLUDED.trial_end,
              updated_at = NOW()
            """
        ),
        {
            "user_id": user_id,
            "stripe_customer_id": stripe_customer_id,
            "stripe_subscription_id": stripe_subscription_id,
            "stripe_price_id": stripe_price_id,
            "tier": tier,
            "status": status,
            "current_period_start": _ts(current_period_start),
            "current_period_end": _ts(current_period_end),
            "cancel_at_period_end": cancel_at_period_end,
            "trial_start": _ts(trial_start),
            "trial_end": _ts(trial_end),
        },
    )
    await db.commit()


async def update_subscription_status(db: AsyncSession, stripe_subscription_id: str, status: str) -> None:
    await db.execute(
        text(
            """
            UPDATE tcg_judge.subscriptions
            SET status = CAST(:status AS tcg_judge.subscription_status), updated_at = NOW()
            WHERE stripe_subscription_id = :sid
            """
        ),
        {"status": status, "sid": stripe_subscription_id},
    )
    await db.commit()


async def cancel_subscription_row(
    db: AsyncSession,
    stripe_subscription_id: str,
    canceled_at: int | None,
) -> None:
    await db.execute(
        text(
            """
            UPDATE tcg_judge.subscriptions
            SET status = 'canceled',
                tier = 'free',
                canceled_at = :canceled_at,
                updated_at = NOW()
            WHERE stripe_subscription_id = :sid
            """
        ),
        {
            "sid": stripe_subscription_id,
            "canceled_at": _ts(canceled_at) or datetime.now(UTC),
        },
    )
    await db.commit()


async def sync_subscription_from_stripe(db: AsyncSession, stripe_sub: dict[str, Any]) -> None:
    sub_id = stripe_sub.get("id")
    if not sub_id:
        return
    row = (
        await db.execute(
            text("SELECT user_id FROM tcg_judge.subscriptions WHERE stripe_subscription_id = :sid"),
            {"sid": sub_id},
        )
    ).mappings().first()
    if not row:
        meta_uid = (stripe_sub.get("metadata") or {}).get("user_id")
        if not meta_uid:
            return
        user_id = str(meta_uid)
    else:
        user_id = str(row["user_id"])

    items = (stripe_sub.get("items") or {}).get("data") or []
    price_id = items[0]["price"]["id"] if items else None
    settings = get_settings()
    tier = tier_from_price_id(settings, price_id or "")

    await upsert_subscription(
        db,
        user_id=user_id,
        stripe_customer_id=str(stripe_sub.get("customer") or ""),
        stripe_subscription_id=sub_id,
        stripe_price_id=price_id,
        status=str(stripe_sub.get("status", "active")),
        tier=tier,
        current_period_start=stripe_sub.get("current_period_start"),
        current_period_end=stripe_sub.get("current_period_end"),
        cancel_at_period_end=bool(stripe_sub.get("cancel_at_period_end")),
        trial_start=stripe_sub.get("trial_start"),
        trial_end=stripe_sub.get("trial_end"),
    )


async def insert_invoice(db: AsyncSession, **fields: Any) -> None:
    user_id = fields.get("user_id")
    if not user_id:
        cust = fields.get("stripe_customer_id")
        if cust:
            row = (
                await db.execute(
                    text(
                        "SELECT user_id FROM tcg_judge.subscriptions WHERE stripe_customer_id = :c LIMIT 1"
                    ),
                    {"c": cust},
                )
            ).mappings().first()
            if row:
                user_id = row["user_id"]
    if not user_id:
        logger.warning("invoice_without_user", invoice=fields.get("stripe_invoice_id"))
        return

    await db.execute(
        text(
            """
            INSERT INTO tcg_judge.invoices (
              user_id, stripe_invoice_id, stripe_subscription_id,
              amount_due, amount_paid, currency, status,
              invoice_pdf, hosted_invoice_url, period_start, period_end
            ) VALUES (
              :user_id, :stripe_invoice_id, :stripe_subscription_id,
              :amount_due, :amount_paid, :currency, :status,
              :invoice_pdf, :hosted_invoice_url, :period_start, :period_end
            )
            ON CONFLICT (stripe_invoice_id) DO UPDATE SET
              amount_paid = EXCLUDED.amount_paid,
              status = EXCLUDED.status
            """
        ),
        {
            "user_id": user_id,
            "stripe_invoice_id": fields["stripe_invoice_id"],
            "stripe_subscription_id": fields.get("stripe_subscription_id"),
            "amount_due": fields.get("amount_due"),
            "amount_paid": fields.get("amount_paid"),
            "currency": fields.get("currency") or "brl",
            "status": fields.get("status"),
            "invoice_pdf": fields.get("invoice_pdf"),
            "hosted_invoice_url": fields.get("hosted_invoice_url"),
            "period_start": _ts(fields.get("period_start")),
            "period_end": _ts(fields.get("period_end")),
        },
    )
    await db.commit()
