"""Fulfillment Context — aggregate, state machine e integração lojista (WF-006)."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from typing import Any, Literal

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.seller_dashboard import resolve_owner_store
from app.marketplace.seller_rbac import has_store_permission
from app.marketplace.seller_team import resolve_store_actor
from app.platform.jobs import (
    JOB_FULFILLMENT_CARRIER_WEBHOOK,
    JOB_FULFILLMENT_CREATE,
    JOB_FULFILLMENT_GENERATE_LABEL,
    JOB_FULFILLMENT_SYNC_ORDER,
    JOB_FULFILLMENT_TRACKING_SYNC,
    emit_outbox_event,
    enqueue_job,
)

logger = structlog.get_logger(__name__)

FulfillmentStatus = Literal[
    "Pending",
    "Picking",
    "Picked",
    "Packing",
    "Packed",
    "ReadyToShip",
    "Shipped",
    "InTransit",
    "Delivered",
    "Completed",
    "Delayed",
    "Lost",
    "Returned",
    "Cancelled",
    "Exception",
    "Failed",
]

_TRANSITIONS: dict[str, set[str]] = {
    "Pending": {"Picking", "Cancelled"},
    "Picking": {"Picked", "Cancelled", "Exception"},
    "Picked": {"Packing", "Cancelled"},
    "Packing": {"Packed", "Cancelled"},
    "Packed": {"ReadyToShip", "Cancelled"},
    "ReadyToShip": {"Shipped", "Cancelled"},
    "Shipped": {"InTransit", "Delivered", "Delayed", "Lost", "Exception"},
    "InTransit": {"Delivered", "Delayed", "Lost", "Exception"},
    "Delivered": {"Completed", "Returned"},
    "Delayed": {"InTransit", "Delivered", "Lost"},
    "Exception": {"Picking", "Cancelled", "Failed"},
    "Lost": {"Returned", "Cancelled"},
    "Returned": set(),
    "Cancelled": set(),
    "Failed": set(),
    "Completed": set(),
}

_COMMAND_TO_STATUS: dict[str, FulfillmentStatus] = {
    "start_picking": "Picking",
    "complete_picking": "Picked",
    "start_packing": "Packing",
    "complete_packing": "Packed",
    "ready_to_ship": "ReadyToShip",
    "confirm_ship": "Shipped",
    "confirm_delivery": "Delivered",
    "complete": "Completed",
    "cancel": "Cancelled",
}

_COMMAND_EVENTS: dict[str, str] = {
    "start_picking": "PickingStarted",
    "complete_picking": "PickingCompleted",
    "start_packing": "PackingStarted",
    "complete_packing": "PackingCompleted",
    "ready_to_ship": "ShippingLabelGenerated",
    "confirm_ship": "ShipmentPosted",
    "confirm_delivery": "ShipmentDelivered",
    "complete": "FulfillmentCompleted",
    "cancel": "FulfillmentCancelled",
}

_FULFILLMENT_ACTION_PERMISSION: dict[str, tuple[str, str]] = {
    "start_picking": ("orders", "edit"),
    "complete_picking": ("orders", "edit"),
    "start_packing": ("orders", "edit"),
    "complete_packing": ("orders", "edit"),
    "ready_to_ship": ("orders", "edit"),
    "generate_label": ("orders", "edit"),
    "confirm_ship": ("orders", "edit"),
    "confirm_delivery": ("orders", "approve"),
    "complete": ("orders", "approve"),
    "cancel": ("orders", "approve"),
}


def _validate_transition(current: str, target: str) -> None:
    allowed = _TRANSITIONS.get(current, set())
    if target not in allowed:
        raise HTTPException(409, f"Transição inválida: {current} → {target}")


async def on_order_paid_enqueue_fulfillment(session: AsyncSession, order_id: str) -> None:
    existing = (
        await session.execute(
            text("SELECT id FROM tcg_judge.fulfillments WHERE order_id = CAST(:oid AS uuid)"),
            {"oid": order_id},
        )
    ).mappings().first()
    if existing:
        return

    order = (
        await session.execute(
            text("SELECT id FROM tcg_judge.shop_orders WHERE id = CAST(:oid AS uuid)"),
            {"oid": order_id},
        )
    ).mappings().first()
    if not order:
        return

    await enqueue_job(
        session,
        job_type=JOB_FULFILLMENT_CREATE,
        payload={"order_id": order_id},
        correlation_id=str(uuid.uuid4()),
    )


async def create_fulfillment_for_order(session: AsyncSession, order_id: str) -> dict[str, Any]:
    order = (
        await session.execute(
            text(
                """
                SELECT id, store_id, status
                FROM tcg_judge.shop_orders
                WHERE id = CAST(:oid AS uuid)
                """
            ),
            {"oid": order_id},
        )
    ).mappings().first()
    if not order:
        raise ValueError(f"Order not found: {order_id}")
    if order["status"] not in ("paid", "processing", "shipped", "delivered"):
        raise ValueError(f"Order {order_id} not eligible: {order['status']}")

    existing = (
        await session.execute(
            text("SELECT id FROM tcg_judge.fulfillments WHERE order_id = CAST(:oid AS uuid)"),
            {"oid": order_id},
        )
    ).mappings().first()
    if existing:
        return {"fulfillment_id": str(existing["id"]), "created": False}

    correlation_id = str(uuid.uuid4())
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.fulfillments
                  (order_id, store_id, status, correlation_id, accepted_at)
                VALUES (
                  CAST(:oid AS uuid), CAST(:sid AS uuid), 'Pending',
                  CAST(:cid AS uuid), NOW()
                )
                RETURNING *
                """
            ),
            {"oid": order_id, "sid": str(order["store_id"]), "cid": correlation_id},
        )
    ).mappings().first()
    fid = str(row["id"])

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.fulfillment_status_history
              (fulfillment_id, from_status, to_status, event_type, correlation_id)
            VALUES (CAST(:fid AS uuid), NULL, 'Pending', 'FulfillmentCreated', CAST(:cid AS uuid))
            """
        ),
        {"fid": fid, "cid": correlation_id},
    )

    await emit_outbox_event(
        session,
        event_type="FulfillmentCreated",
        aggregate_type="Fulfillment",
        aggregate_id=fid,
        payload={"order_id": order_id, "store_id": str(order["store_id"])},
        correlation_id=correlation_id,
    )
    await session.commit()
    return {"fulfillment_id": fid, "created": True}


async def get_fulfillment_projection(
    session: AsyncSession,
    order_id: str,
    owner_id: str,
) -> dict[str, Any] | None:
    store = await resolve_owner_store(session, owner_id)
    row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.seller_fulfillment_projection
                WHERE order_id = CAST(:oid AS uuid) AND store_id = CAST(:sid AS uuid)
                """
            ),
            {"oid": order_id, "sid": str(store["id"])},
        )
    ).mappings().first()
    if not row:
        return None

    history = (
        await session.execute(
            text(
                """
                SELECT from_status, to_status, event_type, actor_id, created_at
                FROM tcg_judge.fulfillment_status_history
                WHERE fulfillment_id = CAST(:fid AS uuid)
                ORDER BY created_at ASC
                """
            ),
            {"fid": str(row["fulfillment_id"])},
        )
    ).mappings().all()

    result = dict(row)
    result["timeline"] = [dict(h) for h in history]
    return result


async def execute_fulfillment_command(
    session: AsyncSession,
    order_id: str,
    actor_id: str,
    command: str,
    *,
    carrier: str | None = None,
    tracking_code: str | None = None,
) -> dict[str, Any]:
    if command == "generate_label":
        return await _enqueue_label_generation(session, order_id, actor_id, carrier=carrier)

    target_status = _COMMAND_TO_STATUS.get(command)
    if not target_status:
        raise HTTPException(400, f"Comando inválido: {command}")

    perm = _FULFILLMENT_ACTION_PERMISSION.get(command)
    if not perm:
        raise HTTPException(400, "Permissão não mapeada")

    actor = await resolve_store_actor(session, actor_id, order_id=order_id)
    module, action = perm
    if not has_store_permission(actor["role"], actor.get("permissions"), module, action):
        raise HTTPException(403, "Sem permissão para esta ação de fulfillment")

    fulfillment = await _get_fulfillment_for_order(session, order_id, actor["store_id"])
    current = str(fulfillment["status"])
    _validate_transition(current, target_status)

    correlation_id = str(fulfillment.get("correlation_id") or uuid.uuid4())
    fid = str(fulfillment["id"])

    sla_sets = ""
    if command == "start_picking":
        sla_sets = ", picking_started_at = COALESCE(picking_started_at, NOW())"
    elif command == "complete_packing":
        sla_sets = ", packed_at = COALESCE(packed_at, NOW())"
    elif command == "confirm_ship":
        sla_sets = ", shipped_at = COALESCE(shipped_at, NOW())"

    await session.execute(
        text(
            f"""
            UPDATE tcg_judge.fulfillments
            SET status = :status, updated_at = NOW(),
                completed_at = CASE WHEN :status = 'Completed' THEN NOW() ELSE completed_at END
                {sla_sets}
            WHERE id = CAST(:fid AS uuid)
            """
        ),
        {"fid": fid, "status": target_status},
    )

    event_type = _COMMAND_EVENTS.get(command, "FulfillmentStatusChanged")
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.fulfillment_status_history
              (fulfillment_id, from_status, to_status, actor_id, event_type, correlation_id)
            VALUES (
              CAST(:fid AS uuid), :from_s, :to_s, :actor, :evt, CAST(:cid AS uuid)
            )
            """
        ),
        {
            "fid": fid,
            "from_s": current,
            "to_s": target_status,
            "actor": actor_id,
            "evt": event_type,
            "cid": correlation_id,
        },
    )

    await emit_outbox_event(
        session,
        event_type=event_type,
        aggregate_type="Fulfillment",
        aggregate_id=fid,
        payload={
            "order_id": order_id,
            "from_status": current,
            "to_status": target_status,
            "command": command,
        },
        correlation_id=correlation_id,
    )

    if target_status == "Completed":
        try:
            from app.reputation.reputation_engine import enqueue_reputation_recalc

            await enqueue_reputation_recalc(
                session,
                store_id=str(actor["store_id"]),
                event_type="OrderCompleted",
                source_id=fid,
                correlation_id=correlation_id,
            )
        except Exception as exc:
            logger.warning("reputation_fulfillment_enqueue_failed", fulfillment_id=fid, error=str(exc))

        try:
            from app.analytics.event_bridge import enqueue_analytics_rebuild

            await enqueue_analytics_rebuild(
                session,
                store_id=str(actor["store_id"]),
                event_type="FulfillmentCompleted",
                source_id=fid,
                correlation_id=correlation_id,
            )
        except Exception as exc:
            logger.warning("analytics_fulfillment_enqueue_failed", fulfillment_id=fid, error=str(exc))

    if command == "confirm_ship" and tracking_code:
        await _upsert_shipment(
            session,
            fulfillment_id=fid,
            carrier=carrier,
            tracking_code=tracking_code,
            status="Posted",
        )

    await enqueue_job(
        session,
        job_type=JOB_FULFILLMENT_SYNC_ORDER,
        payload={"fulfillment_id": fid, "actor_id": actor_id},
        correlation_id=correlation_id,
    )

    if command == "confirm_ship" and tracking_code:
        shipment = await _get_latest_shipment(session, fid)
        if shipment:
            await enqueue_job(
                session,
                job_type=JOB_FULFILLMENT_TRACKING_SYNC,
                payload={
                    "shipment_id": str(shipment["id"]),
                    "tracking_status": "InTransit",
                },
                correlation_id=correlation_id,
                run_after=datetime.now(UTC),
            )

    await session.commit()
    projection = await get_fulfillment_projection(session, order_id, actor_id)
    return {"fulfillment": projection, "command": command}


async def _enqueue_label_generation(
    session: AsyncSession,
    order_id: str,
    actor_id: str,
    *,
    carrier: str | None,
) -> dict[str, Any]:
    actor = await resolve_store_actor(session, actor_id, order_id=order_id)
    if not has_store_permission(actor["role"], actor.get("permissions"), "orders", "edit"):
        raise HTTPException(403, "Sem permissão")

    fulfillment = await _get_fulfillment_for_order(session, order_id, actor["store_id"])
    if str(fulfillment["status"]) not in ("Packed", "ReadyToShip"):
        raise HTTPException(409, "Etiqueta só após Packing concluído (Packed/ReadyToShip)")

    correlation_id = str(fulfillment.get("correlation_id") or uuid.uuid4())
    await enqueue_job(
        session,
        job_type=JOB_FULFILLMENT_GENERATE_LABEL,
        payload={
            "fulfillment_id": str(fulfillment["id"]),
            "carrier": carrier or "manual",
        },
        correlation_id=correlation_id,
    )
    await session.commit()
    return {"accepted": True, "job": JOB_FULFILLMENT_GENERATE_LABEL, "command": "generate_label"}


async def generate_shipping_label(
    session: AsyncSession,
    *,
    fulfillment_id: str,
    carrier: str | None,
    correlation_id: str,
) -> None:
    fulfillment = (
        await session.execute(
            text(
                """
                SELECT f.*, o.shipping_address, o.total_cents
                FROM tcg_judge.fulfillments f
                JOIN tcg_judge.shop_orders o ON o.id = f.order_id
                WHERE f.id = CAST(:fid AS uuid)
                """
            ),
            {"fid": fulfillment_id},
        )
    ).mappings().first()
    if not fulfillment:
        raise ValueError("Fulfillment not found")

    store = (
        await session.execute(
            text(
                """
                SELECT id, name, shipping_settings
                FROM tcg_judge.stores WHERE id = CAST(:sid AS uuid)
                """
            ),
            {"sid": str(fulfillment["store_id"])},
        )
    ).mappings().first()
    if not store:
        raise ValueError("Store not found")

    use_melhor = (carrier or "").lower() in ("melhor_envio", "melhorenvio", "melhor envio")
    label_url: str | None = None
    tracking_code: str | None = None
    tracking_url: str | None = None
    external_id: str | None = None
    external_protocol: str | None = None
    cart_item_id: str | None = None
    resolved_carrier = carrier or "manual"

    if use_melhor:
        from app.integrations.melhor_envio.adapter import create_label_for_order

        try:
            me_result = await create_label_for_order(
                order=dict(fulfillment),
                store=dict(store),
            )
            label_url = me_result.label_url
            tracking_code = me_result.tracking_code
            tracking_url = me_result.tracking_url
            external_id = me_result.external_shipment_id
            external_protocol = me_result.external_protocol
            cart_item_id = me_result.cart_item_id
            resolved_carrier = "melhor_envio"
        except Exception as exc:
            logger.error("melhor_envio_label_failed", fulfillment_id=fulfillment_id, error=str(exc))
            raise
    else:
        label_url = f"https://labels.judgetcg.local/{fulfillment_id}.pdf"

    await _upsert_shipment(
        session,
        fulfillment_id=fulfillment_id,
        carrier=resolved_carrier,
        tracking_code=tracking_code,
        status="Created",
        label_url=label_url,
        tracking_url=tracking_url,
        external_provider="melhor_envio" if use_melhor else None,
        external_shipment_id=external_id,
        external_protocol=external_protocol,
        cart_item_id=cart_item_id,
    )

    if str(fulfillment["status"]) in ("Packed", "Picking", "Picked", "Packing"):
        await session.execute(
            text(
                """
                UPDATE tcg_judge.fulfillments
                SET status = 'ReadyToShip', updated_at = NOW()
                WHERE id = CAST(:fid AS uuid)
                  AND status IN ('Packed', 'Picking', 'Picked', 'Packing')
                """
            ),
            {"fid": fulfillment_id},
        )

    await emit_outbox_event(
        session,
        event_type="ShippingLabelGenerated",
        aggregate_type="Fulfillment",
        aggregate_id=fulfillment_id,
        payload={
            "carrier": resolved_carrier,
            "label_url": label_url,
            "external_shipment_id": external_id,
        },
        correlation_id=correlation_id,
    )
    await session.commit()


async def sync_shop_order_from_fulfillment(
    session: AsyncSession,
    *,
    fulfillment_id: str,
    actor_id: str | None = None,
) -> None:
    row = (
        await session.execute(
            text(
                """
                SELECT f.status, f.order_id, s.tracking_code
                FROM tcg_judge.fulfillments f
                LEFT JOIN LATERAL (
                  SELECT tracking_code FROM tcg_judge.fulfillment_shipments
                  WHERE fulfillment_id = f.id ORDER BY created_at DESC LIMIT 1
                ) s ON TRUE
                WHERE f.id = CAST(:fid AS uuid)
                """
            ),
            {"fid": fulfillment_id},
        )
    ).mappings().first()
    if not row:
        return

    fstatus = str(row["status"])
    order_id = str(row["order_id"])
    legacy_status: str | None = None
    extra_sql = ""

    if fstatus in ("Pending", "Picking", "Picked", "Packing", "Packed", "ReadyToShip"):
        legacy_status = "processing"
    elif fstatus in ("Shipped", "InTransit", "Delayed"):
        legacy_status = "shipped"
        extra_sql = ", shipped_at = COALESCE(shipped_at, NOW())"
        if row.get("tracking_code"):
            extra_sql += ", tracking_code = COALESCE(:tracking, tracking_code)"
    elif fstatus in ("Delivered", "Completed"):
        legacy_status = "delivered"
        extra_sql = ", delivered_at = COALESCE(delivered_at, NOW())"
    elif fstatus in ("Cancelled", "Failed", "Lost"):
        legacy_status = "cancelled"

    if not legacy_status:
        return

    params: dict[str, Any] = {"oid": order_id, "status": legacy_status}
    if ":tracking" in extra_sql:
        params["tracking"] = row.get("tracking_code")

    await session.execute(
        text(
            f"""
            UPDATE tcg_judge.shop_orders
            SET status = :status, updated_at = NOW(){extra_sql}
            WHERE id = CAST(:oid AS uuid)
            """
        ),
        params,
    )

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.shop_order_status_history (order_id, status, changed_by)
            VALUES (CAST(:oid AS uuid), :status, :uid)
            """
        ),
        {"oid": order_id, "status": legacy_status, "uid": actor_id},
    )

    from app.marketplace import shop_escrow

    await shop_escrow.sync_escrow_with_order_status(session, order_id, legacy_status)
    await session.commit()


async def sync_tracking_status(
    session: AsyncSession,
    *,
    shipment_id: str,
    tracking_status: str,
) -> None:
    shipment = (
        await session.execute(
            text(
                """
                SELECT fs.*, f.id AS fulfillment_id
                FROM tcg_judge.fulfillment_shipments fs
                JOIN tcg_judge.fulfillments f ON f.id = fs.fulfillment_id
                WHERE fs.id = CAST(:sid AS uuid)
                """
            ),
            {"sid": shipment_id},
        )
    ).mappings().first()
    if not shipment:
        return

    fid = str(shipment["fulfillment_id"])
    correlation_id = str(uuid.uuid4())

    await session.execute(
        text(
            """
            UPDATE tcg_judge.fulfillment_shipments
            SET status = :st, last_tracking_event_at = NOW(), updated_at = NOW()
            WHERE id = CAST(:sid AS uuid)
            """
        ),
        {"sid": shipment_id, "st": tracking_status},
    )

    fulfillment_target: str | None = None
    if tracking_status == "InTransit":
        fulfillment_target = "InTransit"
    elif tracking_status == "Delivered":
        fulfillment_target = "Delivered"

    if fulfillment_target:
        current = (
            await session.execute(
                text("SELECT status FROM tcg_judge.fulfillments WHERE id = CAST(:fid AS uuid)"),
                {"fid": fid},
            )
        ).mappings().first()
        if current and fulfillment_target in _TRANSITIONS.get(str(current["status"]), set()):
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.fulfillments
                    SET status = :st, updated_at = NOW()
                    WHERE id = CAST(:fid AS uuid)
                    """
                ),
                {"fid": fid, "st": fulfillment_target},
            )
            await emit_outbox_event(
                session,
                event_type="ShipmentTrackingUpdated",
                aggregate_type="Fulfillment",
                aggregate_id=fid,
                payload={"shipment_id": shipment_id, "tracking_status": tracking_status},
                correlation_id=correlation_id,
            )
            await enqueue_job(
                session,
                job_type=JOB_FULFILLMENT_SYNC_ORDER,
                payload={"fulfillment_id": fid},
                correlation_id=correlation_id,
            )

    await session.commit()


async def _get_fulfillment_for_order(
    session: AsyncSession, order_id: str, store_id: str
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.fulfillments
                WHERE order_id = CAST(:oid AS uuid) AND store_id = CAST(:sid AS uuid)
                """
            ),
            {"oid": order_id, "sid": store_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Fulfillment não encontrado — aguarde processamento do pedido pago")
    return dict(row)


async def _get_latest_shipment(session: AsyncSession, fulfillment_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.fulfillment_shipments
                WHERE fulfillment_id = CAST(:fid AS uuid)
                ORDER BY created_at DESC LIMIT 1
                """
            ),
            {"fid": fulfillment_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def _upsert_shipment(
    session: AsyncSession,
    *,
    fulfillment_id: str,
    carrier: str | None,
    tracking_code: str | None,
    status: str,
    label_url: str | None = None,
    tracking_url: str | None = None,
    external_provider: str | None = None,
    external_shipment_id: str | None = None,
    external_protocol: str | None = None,
    cart_item_id: str | None = None,
) -> None:
    existing = await _get_latest_shipment(session, fulfillment_id)
    if existing and not tracking_code and not external_shipment_id:
        await session.execute(
            text(
                """
                UPDATE tcg_judge.fulfillment_shipments
                SET carrier = COALESCE(:carrier, carrier),
                    label_url = COALESCE(:label, label_url),
                    tracking_url = COALESCE(:turl, tracking_url),
                    status = :status,
                    external_provider = COALESCE(:prov, external_provider),
                    external_shipment_id = COALESCE(:ext_id, external_shipment_id),
                    external_protocol = COALESCE(:proto, external_protocol),
                    cart_item_id = COALESCE(:cart, cart_item_id),
                    updated_at = NOW()
                WHERE id = CAST(:sid AS uuid)
                """
            ),
            {
                "sid": str(existing["id"]),
                "carrier": carrier,
                "label": label_url,
                "turl": tracking_url,
                "status": status,
                "prov": external_provider,
                "ext_id": external_shipment_id,
                "proto": external_protocol,
                "cart": cart_item_id,
            },
        )
        return

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.fulfillment_shipments
              (fulfillment_id, carrier, tracking_code, label_url, tracking_url, status,
               external_provider, external_shipment_id, external_protocol, cart_item_id, posted_at)
            VALUES (
              CAST(:fid AS uuid), :carrier, :tracking, :label, :turl, :status,
              :prov, :ext_id, :proto, :cart,
              CASE WHEN :status = 'Posted' THEN NOW() ELSE NULL END
            )
            """
        ),
        {
            "fid": fulfillment_id,
            "carrier": carrier,
            "tracking": tracking_code,
            "label": label_url,
            "turl": tracking_url,
            "status": status,
            "prov": external_provider,
            "ext_id": external_shipment_id,
            "proto": external_protocol,
            "cart": cart_item_id,
        },
    )

    if tracking_code:
        await emit_outbox_event(
            session,
            event_type="ShipmentCreated",
            aggregate_type="Fulfillment",
            aggregate_id=fulfillment_id,
            payload={"tracking_code": tracking_code, "carrier": carrier},
            correlation_id=str(uuid.uuid4()),
        )


_MELHOR_EVENT_TO_SHIPMENT_STATUS: dict[str, str] = {
    "posted": "Posted",
    "delivered": "Delivered",
    "canceled": "Cancelled",
    "cancelled": "Cancelled",
    "in_transit": "InTransit",
    "transit": "InTransit",
}

_MELHOR_EVENT_TO_FULFILLMENT: dict[str, str] = {
    "posted": "Shipped",
    "delivered": "Delivered",
    "in_transit": "InTransit",
    "transit": "InTransit",
    "canceled": "Exception",
    "cancelled": "Exception",
}


async def bulk_execute_fulfillment_commands(
    session: AsyncSession,
    actor_id: str,
    order_ids: list[str],
    command: str,
    *,
    carrier: str | None = None,
) -> dict[str, Any]:
    if not order_ids:
        raise HTTPException(400, "Nenhum pedido selecionado")
    if len(order_ids) > 50:
        raise HTTPException(400, "Máximo 50 pedidos por operação em lote")

    results: list[dict[str, Any]] = []
    for oid in order_ids:
        try:
            outcome = await execute_fulfillment_command(
                session, oid, actor_id, command, carrier=carrier
            )
            results.append({"order_id": oid, "ok": True, "command": command, "fulfillment": outcome.get("fulfillment")})
        except HTTPException as exc:
            results.append({"order_id": oid, "ok": False, "error": str(exc.detail)})
        except Exception as exc:
            results.append({"order_id": oid, "ok": False, "error": str(exc)})

    succeeded = sum(1 for r in results if r["ok"])
    return {
        "command": command,
        "total": len(order_ids),
        "succeeded": succeeded,
        "failed": len(order_ids) - succeeded,
        "results": results,
    }


async def ingest_carrier_webhook(
    session: AsyncSession,
    *,
    provider: str,
    event_type: str,
    external_event_id: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """Persiste webhook e enfileira processamento — HTTP retorna imediatamente."""
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    external_shipment_id = str(data.get("id") or "") or None
    correlation_id = str(uuid.uuid4())

    inserted = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.carrier_webhook_events
                  (provider, external_event_id, event_type, external_shipment_id, payload, correlation_id)
                VALUES (:prov, :eid, :etype, :sid, CAST(:payload AS jsonb), CAST(:cid AS uuid))
                ON CONFLICT (provider, external_event_id) DO NOTHING
                RETURNING id
                """
            ),
            {
                "prov": provider,
                "eid": external_event_id,
                "etype": event_type,
                "sid": external_shipment_id,
                "payload": json.dumps(payload),
                "cid": correlation_id,
            },
        )
    ).mappings().first()

    if not inserted:
        await session.commit()
        return {"accepted": True, "duplicate": True}

    await enqueue_job(
        session,
        job_type=JOB_FULFILLMENT_CARRIER_WEBHOOK,
        payload={"webhook_event_id": str(inserted["id"])},
        correlation_id=correlation_id,
        priority=10,
    )
    await session.commit()
    return {"accepted": True, "webhook_event_id": str(inserted["id"])}


async def process_carrier_webhook_event(session: AsyncSession, webhook_event_id: str) -> None:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.carrier_webhook_events WHERE id = CAST(:id AS uuid)"),
            {"id": webhook_event_id},
        )
    ).mappings().first()
    if not row or row.get("processed_at"):
        return

    provider = str(row["provider"])
    payload = row.get("payload") or {}
    if isinstance(payload, str):
        payload = json.loads(payload)

    if provider == "melhor_envio":
        await _process_melhor_envio_webhook(session, payload, correlation_id=str(row["correlation_id"]))

    await session.execute(
        text(
            """
            UPDATE tcg_judge.carrier_webhook_events
            SET processed_at = NOW()
            WHERE id = CAST(:id AS uuid)
            """
        ),
        {"id": webhook_event_id},
    )
    await session.commit()


async def _process_melhor_envio_webhook(
    session: AsyncSession,
    payload: dict[str, Any],
    *,
    correlation_id: str,
) -> None:
    event = str(payload.get("event") or "")
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    external_id = str(data.get("id") or "")
    if not external_id:
        return

    shipment = (
        await session.execute(
            text(
                """
                SELECT fs.*, f.id AS fulfillment_id, f.status AS fulfillment_status, f.order_id
                FROM tcg_judge.fulfillment_shipments fs
                JOIN tcg_judge.fulfillments f ON f.id = fs.fulfillment_id
                WHERE fs.external_provider = 'melhor_envio'
                  AND fs.external_shipment_id = :ext
                ORDER BY fs.created_at DESC
                LIMIT 1
                """
            ),
            {"ext": external_id},
        )
    ).mappings().first()
    if not shipment:
        logger.warning("melhor_envio_webhook_shipment_not_found", external_id=external_id, event=event)
        return

    fid = str(shipment["fulfillment_id"])
    me_status = str(data.get("status") or event.split(".")[-1] if "." in event else event).lower()
    ship_status = _MELHOR_EVENT_TO_SHIPMENT_STATUS.get(me_status, "InTransit")
    fulfillment_target = _MELHOR_EVENT_TO_FULFILLMENT.get(me_status)

    tracking = data.get("tracking") or data.get("self_tracking")
    tracking_url = data.get("tracking_url")

    await session.execute(
        text(
            """
            UPDATE tcg_judge.fulfillment_shipments
            SET status = :st,
                tracking_code = COALESCE(:tracking, tracking_code),
                tracking_url = COALESCE(:turl, tracking_url),
                last_tracking_event_at = NOW(),
                posted_at = CASE WHEN :st = 'Posted' THEN COALESCE(posted_at, NOW()) ELSE posted_at END,
                delivered_at = CASE WHEN :st = 'Delivered' THEN COALESCE(delivered_at, NOW()) ELSE delivered_at END,
                updated_at = NOW()
            WHERE id = CAST(:sid AS uuid)
            """
        ),
        {
            "sid": str(shipment["id"]),
            "st": ship_status,
            "tracking": str(tracking) if tracking else None,
            "turl": str(tracking_url) if tracking_url else None,
        },
    )

    current = str(shipment["fulfillment_status"])
    if fulfillment_target and fulfillment_target in _TRANSITIONS.get(current, set()):
        await session.execute(
            text(
                """
                UPDATE tcg_judge.fulfillments
                SET status = :st, updated_at = NOW(),
                    shipped_at = CASE WHEN :st IN ('Shipped', 'InTransit') THEN COALESCE(shipped_at, NOW()) ELSE shipped_at END
                WHERE id = CAST(:fid AS uuid)
                """
            ),
            {"fid": fid, "st": fulfillment_target},
        )
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.fulfillment_status_history
                  (fulfillment_id, from_status, to_status, event_type, correlation_id)
                VALUES (CAST(:fid AS uuid), :from_s, :to_s, 'CarrierWebhookReceived', CAST(:cid AS uuid))
                """
            ),
            {"fid": fid, "from_s": current, "to_s": fulfillment_target, "cid": correlation_id},
        )

    await emit_outbox_event(
        session,
        event_type="CarrierWebhookReceived",
        aggregate_type="Fulfillment",
        aggregate_id=fid,
        payload={
            "provider": "melhor_envio",
            "event": event,
            "external_shipment_id": external_id,
            "status": me_status,
            "tracking": tracking,
        },
        correlation_id=correlation_id,
    )

    await enqueue_job(
        session,
        job_type=JOB_FULFILLMENT_SYNC_ORDER,
        payload={"fulfillment_id": fid},
        correlation_id=correlation_id,
    )


async def get_fulfillment_sla_metrics(session: AsyncSession, store_id: str) -> dict[str, int]:
    """SLA-001..003 — fulfillment.md."""
    row = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) FILTER (
                    WHERE status = 'Pending'
                      AND accepted_at IS NOT NULL
                      AND accepted_at < NOW() - INTERVAL '4 hours'
                  )::int AS picking_overdue,
                  COUNT(*) FILTER (
                    WHERE status IN ('Pending', 'Picking', 'Picked', 'Packing')
                      AND accepted_at IS NOT NULL
                      AND accepted_at < NOW() - INTERVAL '24 hours'
                  )::int AS packing_overdue,
                  COUNT(*) FILTER (
                    WHERE status NOT IN ('Shipped', 'InTransit', 'Delivered', 'Completed', 'Cancelled', 'Failed', 'Lost')
                      AND accepted_at IS NOT NULL
                      AND accepted_at < NOW() - INTERVAL '48 hours'
                  )::int AS shipping_overdue
                FROM tcg_judge.fulfillments
                WHERE store_id = CAST(:sid AS uuid)
                  AND status NOT IN ('Completed', 'Cancelled', 'Failed')
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    tracking_row = (
        await session.execute(
            text(
                """
                SELECT COUNT(*)::int AS cnt
                FROM tcg_judge.carrier_webhook_events cwe
                JOIN tcg_judge.fulfillment_shipments fs
                  ON fs.external_shipment_id = cwe.external_shipment_id
                 AND fs.external_provider = cwe.provider
                JOIN tcg_judge.fulfillments f ON f.id = fs.fulfillment_id
                WHERE f.store_id = CAST(:sid AS uuid)
                  AND cwe.processed_at IS NOT NULL
                  AND cwe.received_at > NOW() - INTERVAL '7 days'
                  AND (
                    fs.last_tracking_event_at IS NULL
                    OR fs.last_tracking_event_at > cwe.received_at + INTERVAL '5 minutes'
                  )
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    return {
        "picking_overdue": int(row["picking_overdue"] if row else 0),
        "packing_overdue": int(row["packing_overdue"] if row else 0),
        "shipping_overdue": int(row["shipping_overdue"] if row else 0),
        "tracking_delayed": int(tracking_row["cnt"] if tracking_row else 0),
    }
