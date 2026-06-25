"""CRUD e verificação de alertas de preço."""

from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.alerts.email_sender import send_price_alert_email
from app.notifications.service import notification_service
from app.players.store import ensure_player_profile

MAX_ACTIVE_ALERTS = 50
VALID_CARD_CONDITIONS = frozenset({"NM", "LP", "MP", "HP", "DM"})
VALID_PRICE_CONDITIONS = frozenset({"below", "above", "change_up", "change_down"})
VALID_STATUSES = frozenset({"active", "triggered", "disabled", "expired"})


def _parse_uuid(value: str, *, field: str = "id") -> UUID:
    try:
        return UUID(str(value))
    except ValueError as exc:
        raise HTTPException(400, f"{field} inválido") from exc


async def _get_card_row(session: AsyncSession, card_id: UUID) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT id, name, set_name, image_url, image_uris
                FROM tcg_judge.card_catalog
                WHERE id = :id
                """
            ),
            {"id": card_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Carta não encontrada")
    return dict(row)


async def _current_lowest_price_cents(
    session: AsyncSession,
    card_id: UUID,
    *,
    target_card_condition: str | None = None,
    target_foil: bool | None = None,
) -> int | None:
    listing_clauses = ["card_id = :cid", "status = 'active'"]
    params: dict[str, Any] = {"cid": card_id}
    if target_card_condition:
        listing_clauses.append("condition = :cond")
        params["cond"] = target_card_condition.upper()
    if target_foil is not None:
        listing_clauses.append("foil = :foil")
        params["foil"] = target_foil

    listing_row = (
        await session.execute(
            text(
                f"""
                SELECT MIN(price_cents) AS min_cents
                FROM tcg_judge.card_listings
                WHERE {' AND '.join(listing_clauses)}
                """
            ),
            params,
        )
    ).mappings().first()
    if listing_row and listing_row["min_cents"] is not None:
        return int(listing_row["min_cents"])

    clauses = ["card_id = :cid"]
    if target_card_condition:
        clauses.append("condition = :cond")
    if target_foil is not None:
        clauses.append("foil = :foil")

    row = (
        await session.execute(
            text(
                f"""
                SELECT MIN(price_cents) AS min_cents
                FROM tcg_judge.card_prices
                WHERE {' AND '.join(clauses)}
                """
            ),
            params,
        )
    ).mappings().first()
    if not row or row["min_cents"] is None:
        return None
    return int(row["min_cents"])


async def _price_change_7d_pct(session: AsyncSession, card_id: UUID) -> float | None:
    current = await _current_lowest_price_cents(session, card_id)
    if not current:
        return None
    week_ago = datetime.now(UTC) - timedelta(days=7)
    old_row = (
        await session.execute(
            text(
                """
                SELECT price_cents FROM tcg_judge.card_prices
                WHERE card_id = :cid AND recorded_at <= :week
                ORDER BY recorded_at DESC
                LIMIT 1
                """
            ),
            {"cid": card_id, "week": week_ago},
        )
    ).mappings().first()
    if not old_row or not old_row["price_cents"]:
        return None
    previous = int(old_row["price_cents"])
    if previous <= 0:
        return None
    return round(((current - previous) / previous) * 100, 2)


def _image_url(card: dict[str, Any]) -> str | None:
    uris = card.get("image_uris") or {}
    if isinstance(uris, dict):
        return uris.get("small") or uris.get("normal") or card.get("image_url")
    return card.get("image_url")


def _alert_payload(row: dict[str, Any], *, current_cents: int | None = None) -> dict[str, Any]:
    target_cents = int(row["target_price_cents"])
    diff_pct: float | None = None
    if current_cents is not None and target_cents > 0:
        diff_pct = round(((current_cents - target_cents) / target_cents) * 100, 2)

    return {
        "id": str(row["id"]),
        "cardId": str(row["card_id"]),
        "cardName": row.get("card_name") or "",
        "cardImageUrl": row.get("card_image_url"),
        "setName": row.get("set_name") or "",
        "targetPrice": round(target_cents / 100, 2),
        "targetPriceCents": target_cents,
        "condition": row["price_condition"],
        "targetPercentage": float(row["target_percentage"]) if row.get("target_percentage") is not None else None,
        "triggerCount": int(row.get("trigger_count") or 0),
        "targetCondition": row.get("target_card_condition"),
        "targetFoil": row.get("target_foil"),
        "status": row["status"],
        "currentPrice": round(current_cents / 100, 2) if current_cents is not None else None,
        "priceDifference": diff_pct,
        "emailNotified": bool(row.get("email_notified")),
        "pushNotified": bool(row.get("push_notified")),
        "createdAt": str(row.get("created_at") or ""),
        "expiresAt": str(row.get("expires_at") or ""),
        "triggeredAt": str(row["triggered_at"]) if row.get("triggered_at") else None,
    }


async def create_price_alert(
    session: AsyncSession,
    user_id: str,
    *,
    card_id: str,
    target_price: float,
    condition: str = "below",
    target_condition: str | None = None,
    target_foil: bool | None = None,
    target_percentage: float | None = None,
) -> dict[str, Any]:
    await ensure_player_profile(session, user_id)

    if condition not in VALID_PRICE_CONDITIONS:
        raise HTTPException(400, "Condição de preço inválida")
    if condition in {"change_up", "change_down"}:
        if target_percentage is None or target_percentage <= 0:
            raise HTTPException(400, "Informe target_percentage para alertas de variação")
    elif target_price <= 0:
        raise HTTPException(400, "Preço-alvo inválido")
    if target_condition and target_condition.upper() not in VALID_CARD_CONDITIONS:
        raise HTTPException(400, "Condição da carta inválida")

    card_uuid = _parse_uuid(card_id, field="card_id")
    card = await _get_card_row(session, card_uuid)
    target_cents = int(round(target_price * 100)) if target_price > 0 else 1
    if target_cents <= 0:
        raise HTTPException(400, "Preço-alvo inválido")

    if condition in {"change_up", "change_down"}:
        baseline = await _current_lowest_price_cents(session, card_uuid)
        if baseline:
            target_cents = baseline

    count_row = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS c FROM tcg_judge.price_alerts
                WHERE user_id = :uid AND status = 'active'
                """
            ),
            {"uid": user_id},
        )
    ).mappings().first()
    if count_row and int(count_row["c"]) >= MAX_ACTIVE_ALERTS:
        raise HTTPException(400, f"Limite de {MAX_ACTIVE_ALERTS} alertas ativos atingido")

    expires = datetime.now(UTC) + timedelta(days=90)
    card_cond = target_condition.upper() if target_condition else None

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.price_alerts (
                  user_id, card_id, target_price_cents, price_condition,
                  target_card_condition, target_foil, status, expires_at,
                  target_percentage
                ) VALUES (
                  :uid, :cid, :target, :pcond, :tcond, :foil, 'active', :exp,
                  :tpct
                )
                RETURNING *
                """
            ),
            {
                "uid": user_id,
                "cid": card_uuid,
                "target": target_cents,
                "pcond": condition,
                "tcond": card_cond,
                "foil": target_foil,
                "exp": expires,
                "tpct": target_percentage,
            },
        )
    ).mappings().first()
    await session.commit()

    current = await _current_lowest_price_cents(
        session, card_uuid, target_card_condition=card_cond, target_foil=target_foil
    )
    merged = {
        **dict(row),
        "card_name": card["name"],
        "set_name": card.get("set_name"),
        "card_image_url": _image_url(card),
    }
    return _alert_payload(merged, current_cents=current)


async def list_user_alerts(
    session: AsyncSession,
    user_id: str,
    *,
    status: str | None = None,
) -> list[dict[str, Any]]:
    clauses = ["pa.user_id = :uid"]
    params: dict[str, Any] = {"uid": user_id}
    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(400, "Status inválido")
        clauses.append("pa.status = :status")
        params["status"] = status

    rows = (
        await session.execute(
            text(
                f"""
                SELECT pa.*, cc.name AS card_name, cc.set_name,
                       cc.image_url, cc.image_uris AS card_image_uris
                FROM tcg_judge.price_alerts pa
                JOIN tcg_judge.card_catalog cc ON cc.id = pa.card_id
                WHERE {' AND '.join(clauses)}
                ORDER BY pa.created_at DESC
                LIMIT 100
                """
            ),
            params,
        )
    ).mappings().all()

    results: list[dict[str, Any]] = []
    for row in rows:
        r = dict(row)
        uris = r.pop("card_image_uris", None) or {}
        if not r.get("card_image_url") and isinstance(uris, dict):
            r["card_image_url"] = uris.get("small") or uris.get("normal")
        current = await _current_lowest_price_cents(
            session,
            UUID(str(r["card_id"])),
            target_card_condition=r.get("target_card_condition"),
            target_foil=r.get("target_foil"),
        )
        results.append(_alert_payload(r, current_cents=current))
    return results


async def get_user_alert(session: AsyncSession, user_id: str, alert_id: str) -> dict[str, Any]:
    uid = _parse_uuid(alert_id)
    row = (
        await session.execute(
            text(
                """
                SELECT pa.*, cc.name AS card_name, cc.set_name, cc.image_url, cc.image_uris
                FROM tcg_judge.price_alerts pa
                JOIN tcg_judge.card_catalog cc ON cc.id = pa.card_id
                WHERE pa.id = :id AND pa.user_id = :uid
                """
            ),
            {"id": uid, "uid": user_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Alerta não encontrado")
    r = dict(row)
    uris = r.get("image_uris") or {}
    if isinstance(uris, dict) and not r.get("card_image_url"):
        r["card_image_url"] = uris.get("small") or uris.get("normal")
    current = await _current_lowest_price_cents(
        session,
        UUID(str(r["card_id"])),
        target_card_condition=r.get("target_card_condition"),
        target_foil=r.get("target_foil"),
    )
    return _alert_payload(r, current_cents=current)


async def update_price_alert(
    session: AsyncSession,
    user_id: str,
    alert_id: str,
    *,
    target_price: float | None = None,
    condition: str | None = None,
    status: str | None = None,
) -> dict[str, Any]:
    uid = _parse_uuid(alert_id)
    existing = (
        await session.execute(
            text("SELECT id FROM tcg_judge.price_alerts WHERE id = :id AND user_id = :uid"),
            {"id": uid, "uid": user_id},
        )
    ).first()
    if not existing:
        raise HTTPException(404, "Alerta não encontrado")

    sets: list[str] = ["updated_at = NOW()"]
    params: dict[str, Any] = {"id": uid, "uid": user_id}

    if target_price is not None:
        cents = int(round(target_price * 100))
        if cents <= 0:
            raise HTTPException(400, "Preço inválido")
        sets.append("target_price_cents = :target")
        params["target"] = cents

    if condition is not None:
        if condition not in VALID_PRICE_CONDITIONS:
            raise HTTPException(400, "Condição inválida")
        sets.append("price_condition = :pcond")
        params["pcond"] = condition

    if status is not None:
        if status not in {"active", "disabled"}:
            raise HTTPException(400, "Status inválido")
        sets.append("status = :status")
        params["status"] = status
        if status == "active":
            sets.extend(
                [
                    "triggered_at = NULL",
                    "email_notified = FALSE",
                    "push_notified = FALSE",
                ]
            )

    if len(sets) == 1:
        raise HTTPException(400, "Nada para atualizar")

    await session.execute(
        text(f"UPDATE tcg_judge.price_alerts SET {', '.join(sets)} WHERE id = :id AND user_id = :uid"),
        params,
    )
    await session.commit()
    return await get_user_alert(session, user_id, alert_id)


async def delete_price_alert(session: AsyncSession, user_id: str, alert_id: str) -> dict[str, bool]:
    uid = _parse_uuid(alert_id)
    result = await session.execute(
        text("DELETE FROM tcg_judge.price_alerts WHERE id = :id AND user_id = :uid RETURNING id"),
        {"id": uid, "uid": user_id},
    )
    if not result.first():
        raise HTTPException(404, "Alerta não encontrado")
    await session.commit()
    return {"success": True}


async def _user_email(session: AsyncSession, user_id: str) -> str | None:
    try:
        row = (
            await session.execute(
                text("SELECT email FROM auth.users WHERE id = :id::uuid"),
                {"id": user_id},
            )
        ).mappings().first()
        if row and row.get("email"):
            return str(row["email"])
    except Exception:
        pass
    return None


async def check_price_alerts(session: AsyncSession) -> dict[str, int]:
    """Verifica alertas ativos e dispara notificações."""
    now = datetime.now(UTC)
    await session.execute(
        text(
            """
            UPDATE tcg_judge.price_alerts
            SET status = 'expired', updated_at = NOW()
            WHERE status = 'active' AND expires_at < :now
            """
        ),
        {"now": now},
    )

    rows = (
        await session.execute(
            text(
                """
                SELECT pa.*, cc.name AS card_name, cc.set_name, cc.image_url, cc.image_uris
                FROM tcg_judge.price_alerts pa
                JOIN tcg_judge.card_catalog cc ON cc.id = pa.card_id
                WHERE pa.status = 'active' AND pa.expires_at >= :now
                """
            ),
            {"now": now},
        )
    ).mappings().all()

    triggered_count = 0
    app_base = os.getenv("APP_PUBLIC_URL", "https://judgetcg.com.br").rstrip("/")

    for raw in rows:
        alert = dict(raw)
        card_id = UUID(str(alert["card_id"]))
        current = await _current_lowest_price_cents(
            session,
            card_id,
            target_card_condition=alert.get("target_card_condition"),
            target_foil=alert.get("target_foil"),
        )

        await session.execute(
            text("UPDATE tcg_judge.price_alerts SET last_checked_at = :now WHERE id = :id"),
            {"now": now, "id": alert["id"]},
        )

        cooldown_h = int(alert.get("cooldown_hours") or 24)
        last_notified = alert.get("last_notified_at")
        if last_notified:
            if getattr(last_notified, "tzinfo", None) is None:
                last_notified = last_notified.replace(tzinfo=UTC)
            if (now - last_notified).total_seconds() < cooldown_h * 3600:
                continue

        pcond = str(alert["price_condition"])
        if pcond not in {"change_up", "change_down"} and current is None:
            continue
        fired = False
        target = int(alert["target_price_cents"])
        target_display = f"R$ {target / 100:.2f}"
        triggered_display = f"R$ {current / 100:.2f}" if current is not None else "—"

        if pcond == "below":
            fired = current <= target
        elif pcond == "above":
            fired = current >= target
        elif pcond in {"change_up", "change_down"}:
            pct_target = float(alert.get("target_percentage") or 0)
            change_pct = await _price_change_7d_pct(session, card_id)
            if change_pct is not None and pct_target > 0:
                fired = (pcond == "change_up" and change_pct >= pct_target) or (
                    pcond == "change_down" and change_pct <= -pct_target
                )
                target_display = f"{pct_target:.1f}% em 7d"
                triggered_display = f"{change_pct:+.1f}%"

        if not fired:
            continue

        one_shot = pcond in {"below", "above"}
        if one_shot:
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.price_alerts
                    SET status = 'triggered', triggered_at = :now, updated_at = :now,
                        last_notified_at = :now,
                        trigger_count = COALESCE(trigger_count, 0) + 1
                    WHERE id = :id
                    """
                ),
                {"now": now, "id": alert["id"]},
            )
        else:
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.price_alerts
                    SET triggered_at = :now, updated_at = :now, last_notified_at = :now,
                        trigger_count = COALESCE(trigger_count, 0) + 1,
                        email_notified = FALSE, push_notified = FALSE
                    WHERE id = :id
                    """
                ),
                {"now": now, "id": alert["id"]},
            )
        triggered_count += 1

        card_name = str(alert.get("card_name") or "Carta")
        image_url = _image_url(alert)
        card_url = f"{app_base}/loja/cartas/{alert['card_id']}"

        user_id = str(alert["user_id"])
        email = await _user_email(session, user_id)
        success = False
        err: str | None = "email_unavailable"
        if email:
            success, err = await send_price_alert_email(
                to_email=email,
                card_name=card_name,
                target_price_display=target_display,
                triggered_price_display=triggered_display,
                card_url=card_url,
            )
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.alert_notifications (
                  alert_id, notification_type, success, error_message,
                  triggered_price_cents, card_name, card_image_url
                ) VALUES (:aid, 'email', :ok, :err, :price, :name, :img)
                """
            ),
            {
                "aid": alert["id"],
                "ok": success,
                "err": err,
                "price": current,
                "name": card_name[:300],
                "img": image_url,
            },
        )
        if success:
            await session.execute(
                text("UPDATE tcg_judge.price_alerts SET email_notified = TRUE WHERE id = :id"),
                {"id": alert["id"]},
            )

        await notification_service.send(
            session,
            "price_alert:triggered",
            player_ids=[user_id],
            body=f"{card_name}: {triggered_display} (alvo {target_display})",
            data={"cardId": str(alert["card_id"]), "alertId": str(alert["id"]), "url": card_url},
            channels=["in_app", "push"],
        )
        await session.execute(
            text("UPDATE tcg_judge.price_alerts SET push_notified = TRUE WHERE id = :id"),
            {"id": alert["id"]},
        )

    await session.commit()
    return {"checked": len(rows), "triggered": triggered_count}
