"""Reputation Engine V2 — WF-009 score derivado de eventos."""

from __future__ import annotations

import json
import math
import uuid
from datetime import UTC, datetime
from typing import Any, Literal

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.platform.jobs import (
    JOB_REPUTATION_RECALCULATE,
    JOB_REPUTATION_SLA_CHECK,
    emit_outbox_event,
    enqueue_job,
)
from app.reputation.anti_fraud import compute_fraud_penalty, detect_anti_fraud_flags
from app.reputation.signal_collector import collect_store_signals

logger = structlog.get_logger(__name__)

SellerLevel = Literal["new", "bronze", "silver", "gold", "platinum"]

COLD_START_ORDERS = 5
COLD_START_BASELINE = 75.0

_LEVEL_THRESHOLDS: list[tuple[float, SellerLevel]] = [
    (95.0, "platinum"),
    (90.0, "gold"),
    (80.0, "silver"),
    (70.0, "bronze"),
]


async def _load_weights(session: AsyncSession) -> dict[str, float]:
    rows = (
        await session.execute(
            text("SELECT signal_key, weight FROM tcg_judge.reputation_signal_weights")
        )
    ).mappings().all()
    if not rows:
        return {"sales": 0.25, "delivery": 0.30, "quality": 0.15, "compliance": 0.30}
    return {str(r["signal_key"]): float(r["weight"]) for r in rows}


def _compute_sales_score(orders_completed: int, orders_cancelled: int) -> float:
    if orders_completed <= 0:
        return COLD_START_BASELINE
    cancel_rate = orders_cancelled / max(orders_completed + orders_cancelled, 1)
    volume_factor = min(100.0, 50.0 + 10.0 * math.log10(max(orders_completed, 1) + 1))
    return max(0.0, min(100.0, volume_factor - cancel_rate * 40.0))


def _compute_delivery_score(sla_violations: int, orders_completed: int) -> float:
    if orders_completed < COLD_START_ORDERS:
        return COLD_START_BASELINE
    penalty = min(100.0, sla_violations * 8.0)
    return max(0.0, 100.0 - penalty)


def _compute_quality_score(review_avg: float, review_count: int) -> float:
    """Reviews com peso parcial — BR-002."""
    if review_count <= 0:
        return COLD_START_BASELINE
    return max(0.0, min(100.0, (review_avg / 5.0) * 100.0))


def _compute_compliance_score(
    chargebacks_open: int,
    disputes_open: int,
    refund_rate: float,
) -> float:
    penalty = chargebacks_open * 12.0 + disputes_open * 8.0 + refund_rate * 50.0
    return max(0.0, 100.0 - min(100.0, penalty))


def _resolve_level(trust_score: float, orders_completed: int) -> SellerLevel:
    if orders_completed < COLD_START_ORDERS:
        return "new"
    for threshold, level in _LEVEL_THRESHOLDS:
        if trust_score >= threshold:
            return level
    return "bronze"


def _build_badges(
    level: SellerLevel,
    signals: dict[str, Any],
    flags: list[str],
) -> list[str]:
    badges: list[str] = []
    if level == "new":
        badges.append("new_seller")
    elif level == "platinum":
        badges.append("top_seller")
    elif level == "gold":
        badges.append("trusted_seller")
    elif level == "silver":
        badges.append("verified_seller")

    if int(signals.get("sla_violations") or 0) == 0 and int(signals.get("orders_completed") or 0) >= 10:
        badges.append("sla_excellent")
    if float(signals.get("review_avg") or 0) >= 4.5 and int(signals.get("review_count") or 0) >= 5:
        badges.append("highly_rated")
    if flags:
        badges.append("under_review")
    return badges


async def ensure_reputation(session: AsyncSession, store_id: str) -> str:
    row = (
        await session.execute(
            text("SELECT id FROM tcg_judge.reputations WHERE store_id = CAST(:sid AS uuid)"),
            {"sid": store_id},
        )
    ).mappings().first()
    if row:
        return str(row["id"])

    created = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.reputations (store_id, trust_score, status)
                VALUES (CAST(:sid AS uuid), :score, 'Updated')
                RETURNING id
                """
            ),
            {"sid": store_id, "score": COLD_START_BASELINE},
        )
    ).mappings().first()
    return str(created["id"])


async def record_signal_event(
    session: AsyncSession,
    *,
    store_id: str,
    event_type: str,
    source_aggregate: str | None = None,
    source_id: str | None = None,
    idempotency_key: str,
    correlation_id: str | None = None,
    payload: dict[str, Any] | None = None,
) -> bool:
    """Registra evento consumido. Retorna False se duplicado (BR-005)."""
    cid = correlation_id or str(uuid.uuid4())
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.reputation_signal_events
                  (idempotency_key, store_id, event_type, source_aggregate,
                   source_id, payload, correlation_id)
                VALUES (
                  :idem, CAST(:sid AS uuid), :etype, :agg,
                  CAST(:src AS uuid), CAST(:payload AS jsonb), CAST(:cid AS uuid)
                )
                ON CONFLICT (idempotency_key) DO NOTHING
                RETURNING id
                """
            ),
            {
                "idem": idempotency_key,
                "sid": store_id,
                "etype": event_type,
                "agg": source_aggregate,
                "src": source_id,
                "payload": json.dumps(payload or {}),
                "cid": cid,
            },
        )
    ).mappings().first()
    return row is not None


async def enqueue_reputation_recalc(
    session: AsyncSession,
    *,
    store_id: str,
    event_type: str,
    source_id: str | None = None,
    correlation_id: str | None = None,
) -> None:
    idem = f"rep-{store_id}-{event_type}-{source_id or 'batch'}"
    if not await record_signal_event(
        session,
        store_id=store_id,
        event_type=event_type,
        source_id=source_id,
        idempotency_key=idem,
        correlation_id=correlation_id,
    ):
        return
    await enqueue_job(
        session,
        job_type=JOB_REPUTATION_RECALCULATE,
        payload={"store_id": store_id, "trigger_event": event_type},
        correlation_id=correlation_id or str(uuid.uuid4()),
        priority=2,
    )


async def recalculate_store_reputation(
    session: AsyncSession,
    *,
    store_id: str,
    correlation_id: str | None = None,
    trigger_event: str | None = None,
) -> dict[str, Any]:
    cid = correlation_id or str(uuid.uuid4())
    rep_id = await ensure_reputation(session, store_id)

    frozen = (
        await session.execute(
            text(
                """
                SELECT status, frozen_reason, trust_score, version
                FROM tcg_judge.reputations WHERE id = CAST(:rid AS uuid)
                """
            ),
            {"rid": rep_id},
        )
    ).mappings().first()
    if frozen and str(frozen["status"]) == "Frozen":
        return {"status": "frozen", "reason": frozen.get("frozen_reason")}

    await session.execute(
        text(
            """
            UPDATE tcg_judge.reputations
            SET status = 'Calculating', updated_at = NOW()
            WHERE id = CAST(:rid AS uuid)
            """
        ),
        {"rid": rep_id},
    )

    signals = await collect_store_signals(session, store_id)
    weights = await _load_weights(session)

    sales = _compute_sales_score(
        int(signals["orders_completed"]), int(signals["orders_cancelled"])
    )
    delivery = _compute_delivery_score(
        int(signals["sla_violations"]), int(signals["orders_completed"])
    )
    quality = _compute_quality_score(
        float(signals["review_avg"]), int(signals["review_count"])
    )
    compliance = _compute_compliance_score(
        int(signals["chargebacks_open"]),
        int(signals["disputes_open"]),
        float(signals["refund_rate"]),
    )

    flags = detect_anti_fraud_flags(signals)
    fraud_penalty = compute_fraud_penalty(flags)
    refund_penalty = min(20.0, float(signals["refund_rate"]) * 100.0)
    dispute_penalty = min(15.0, int(signals["disputes_open"]) * 5.0)

    weighted = (
        sales * weights.get("sales", 0.25)
        + delivery * weights.get("delivery", 0.30)
        + quality * weights.get("quality", 0.15)
        + compliance * weights.get("compliance", 0.30)
    )
    trust_score = max(0.0, min(100.0, round(
        weighted - fraud_penalty - refund_penalty * 0.3 - dispute_penalty * 0.3, 2
    )))

    if int(signals["orders_completed"]) < COLD_START_ORDERS:
        trust_score = COLD_START_BASELINE

    level = _resolve_level(trust_score, int(signals["orders_completed"]))
    badges = _build_badges(level, signals, flags)
    prev_version = int(frozen["version"] if frozen else 1)
    new_version = prev_version + 1
    prev_score = float(frozen["trust_score"] if frozen else COLD_START_BASELINE)

    prev_level_row = (
        await session.execute(
            text("SELECT seller_level FROM tcg_judge.seller_scores WHERE store_id = CAST(:sid AS uuid)"),
            {"sid": store_id},
        )
    ).mappings().first()
    prev_level = str(prev_level_row["seller_level"]) if prev_level_row else "new"

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.seller_scores (
              store_id, reputation_id, trust_score, seller_level,
              sales_score, delivery_score, quality_score, compliance_score,
              fraud_penalty, refund_penalty, dispute_penalty,
              orders_completed, orders_cancelled, chargebacks_open, sla_violations,
              review_avg, review_count, signals, badges, anti_fraud_flags, version
            ) VALUES (
              CAST(:sid AS uuid), CAST(:rid AS uuid), :trust, :level,
              :sales, :delivery, :quality, :compliance,
              :fraud, :refund_p, :dispute_p,
              :oc, :ocancel, :cb, :sla,
              :ravg, :rcnt, CAST(:signals AS jsonb), :badges, :flags, :ver
            )
            ON CONFLICT (store_id) DO UPDATE SET
              trust_score = EXCLUDED.trust_score,
              seller_level = EXCLUDED.seller_level,
              sales_score = EXCLUDED.sales_score,
              delivery_score = EXCLUDED.delivery_score,
              quality_score = EXCLUDED.quality_score,
              compliance_score = EXCLUDED.compliance_score,
              fraud_penalty = EXCLUDED.fraud_penalty,
              refund_penalty = EXCLUDED.refund_penalty,
              dispute_penalty = EXCLUDED.dispute_penalty,
              orders_completed = EXCLUDED.orders_completed,
              orders_cancelled = EXCLUDED.orders_cancelled,
              chargebacks_open = EXCLUDED.chargebacks_open,
              sla_violations = EXCLUDED.sla_violations,
              review_avg = EXCLUDED.review_avg,
              review_count = EXCLUDED.review_count,
              signals = EXCLUDED.signals,
              badges = EXCLUDED.badges,
              anti_fraud_flags = EXCLUDED.anti_fraud_flags,
              version = EXCLUDED.version,
              calculated_at = NOW(),
              updated_at = NOW()
            """
        ),
        {
            "sid": store_id,
            "rid": rep_id,
            "trust": trust_score,
            "level": level,
            "sales": sales,
            "delivery": delivery,
            "quality": quality,
            "compliance": compliance,
            "fraud": fraud_penalty,
            "refund_p": refund_penalty,
            "dispute_p": dispute_penalty,
            "oc": signals["orders_completed"],
            "ocancel": signals["orders_cancelled"],
            "cb": signals["chargebacks_open"],
            "sla": signals["sla_violations"],
            "ravg": signals["review_avg"] or None,
            "rcnt": signals["review_count"],
            "signals": json.dumps(signals),
            "badges": badges,
            "flags": flags,
            "ver": new_version,
        },
    )

    await session.execute(
        text(
            """
            UPDATE tcg_judge.reputations
            SET trust_score = :trust, status = 'Updated', version = :ver,
                last_calculated_at = NOW(), updated_at = NOW()
            WHERE id = CAST(:rid AS uuid)
            """
        ),
        {"rid": rep_id, "trust": trust_score, "ver": new_version},
    )

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.reputation_score_history
              (store_id, from_score, to_score, from_level, to_level,
               event_type, signals_snapshot, version, correlation_id)
            VALUES (
              CAST(:sid AS uuid), :from_s, :to_s, :from_l, :to_l,
              :evt, CAST(:snap AS jsonb), :ver, CAST(:cid AS uuid)
            )
            """
        ),
        {
            "sid": store_id,
            "from_s": prev_score,
            "to_s": trust_score,
            "from_l": prev_level,
            "to_l": level,
            "evt": trigger_event,
            "snap": json.dumps(signals),
            "ver": new_version,
            "cid": cid,
        },
    )

    await emit_outbox_event(
        session,
        event_type="ReputationUpdated",
        aggregate_type="Reputation",
        aggregate_id=rep_id,
        payload={"store_id": store_id, "trust_score": trust_score, "level": level},
        correlation_id=cid,
    )
    if prev_level != level:
        await emit_outbox_event(
            session,
            event_type="SellerLevelChanged",
            aggregate_type="SellerScore",
            aggregate_id=store_id,
            payload={"from_level": prev_level, "to_level": level, "trust_score": trust_score},
            correlation_id=cid,
        )

    logger.info(
        "reputation_recalculated",
        store_id=store_id,
        trust_score=trust_score,
        level=level,
        trigger=trigger_event,
    )
    return {
        "store_id": store_id,
        "trust_score": trust_score,
        "seller_level": level,
        "badges": badges,
        "anti_fraud_flags": flags,
        "version": new_version,
    }


async def run_sla_check_all_stores(
    session: AsyncSession,
    *,
    correlation_id: str | None = None,
    max_stores: int = 100,
) -> dict[str, Any]:
    """Job reputation.sla_check — recalcula lojas com SLA violations."""
    cid = correlation_id or str(uuid.uuid4())
    stores = (
        await session.execute(
            text(
                """
                SELECT DISTINCT f.store_id
                FROM tcg_judge.fulfillments f
                WHERE f.status NOT IN ('Completed', 'Cancelled', 'Failed')
                  AND f.accepted_at IS NOT NULL
                  AND (
                    (f.status = 'Pending' AND f.accepted_at < NOW() - INTERVAL '4 hours')
                    OR (f.status IN ('Pending','Picking','Picked','Packing')
                        AND f.accepted_at < NOW() - INTERVAL '24 hours')
                    OR (f.accepted_at < NOW() - INTERVAL '48 hours')
                  )
                LIMIT :lim
                """
            ),
            {"lim": max_stores},
        )
    ).mappings().all()

    enqueued = 0
    for row in stores:
        store_id = str(row["store_id"])
        await enqueue_reputation_recalc(
            session,
            store_id=store_id,
            event_type="SlaViolationDetected",
            correlation_id=cid,
        )
        enqueued += 1

    return {"stores_checked": len(stores), "recalcs_enqueued": enqueued}


async def get_seller_reputation_dashboard(
    session: AsyncSession,
    store_id: str,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT ss.*, r.status AS reputation_status, r.last_calculated_at
                FROM tcg_judge.seller_scores ss
                JOIN tcg_judge.reputations r ON r.id = ss.reputation_id
                WHERE ss.store_id = CAST(:sid AS uuid)
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    if not row:
        rep_id = await ensure_reputation(session, store_id)
        result = await recalculate_store_reputation(session, store_id=store_id)
        return {
            **result,
            "components": {},
            "alerts": [],
            "sla_detail": {},
        }

    signals = row.get("signals") or {}
    if isinstance(signals, str):
        signals = json.loads(signals)

    alerts: list[dict[str, str]] = []
    flags = list(row.get("anti_fraud_flags") or [])
    if flags:
        alerts.append({"type": "fraud", "severity": "high", "message": f"Sinais: {', '.join(flags)}"})
    if int(row.get("sla_violations") or 0) > 0:
        alerts.append({
            "type": "sla",
            "severity": "medium",
            "message": f"{row['sla_violations']} violação(ões) de SLA operacional",
        })
    if int(row.get("chargebacks_open") or 0) > 0:
        alerts.append({
            "type": "chargeback",
            "severity": "high",
            "message": f"{row['chargebacks_open']} chargeback(s) aberto(s)",
        })
    if str(row.get("seller_level")) == "new":
        alerts.append({
            "type": "cold_start",
            "severity": "info",
            "message": "Complete 5 pedidos para sair do nível Novo vendedor",
        })

    return {
        "store_id": store_id,
        "trust_score": float(row["trust_score"]),
        "seller_level": str(row["seller_level"]),
        "badges": list(row.get("badges") or []),
        "anti_fraud_flags": flags,
        "components": {
            "sales": float(row["sales_score"]),
            "delivery": float(row["delivery_score"]),
            "quality": float(row["quality_score"]),
            "compliance": float(row["compliance_score"]),
            "fraud_penalty": float(row["fraud_penalty"]),
        },
        "orders_completed": int(row["orders_completed"]),
        "review_avg": float(row["review_avg"] or 0),
        "review_count": int(row["review_count"]),
        "sla_violations": int(row["sla_violations"]),
        "sla_detail": signals.get("sla_detail", {}),
        "alerts": alerts,
        "reputation_status": str(row["reputation_status"]),
        "calculated_at": row["last_calculated_at"].isoformat() if row.get("last_calculated_at") else None,
        "version": int(row["version"]),
    }
