"""Equipe da loja — usuários, roles, permissões e audit logs."""

from __future__ import annotations

import json
import uuid
from datetime import date
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.seller_dashboard import resolve_owner_store
from app.marketplace.seller_rbac import VALID_ROLES, merge_permissions


async def _ensure_owner(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    if str(store["id"]) != store_id:
        raise HTTPException(403, "Acesso negado")
    return store


async def resolve_store_actor(
    session: AsyncSession,
    actor_id: str,
    *,
    order_id: str | None = None,
) -> dict[str, Any]:
    """Resolve role/permissões do ator no contexto de um pedido ou loja."""
    if order_id:
        order = (
            await session.execute(
                text(
                    """
                    SELECT o.store_id, s.owner_id
                    FROM tcg_judge.shop_orders o
                    JOIN tcg_judge.stores s ON s.id = o.store_id
                    WHERE o.id = CAST(:oid AS uuid)
                    """
                ),
                {"oid": order_id},
            )
        ).mappings().first()
        if not order:
            raise HTTPException(404, "Pedido não encontrado")
        store_id = str(order["store_id"])
        owner_id = str(order["owner_id"])
    else:
        store = await resolve_owner_store(session, actor_id)
        store_id = str(store["id"])
        owner_id = actor_id

    role_info = await get_user_role(session, store_id, actor_id, owner_id=owner_id)
    role_info["store_id"] = store_id
    return role_info


async def get_user_role(
    session: AsyncSession,
    store_id: str,
    user_id: str,
    owner_id: str | None = None,
) -> dict[str, Any]:
    if owner_id and user_id == owner_id:
        return {
            "user_id": user_id,
            "store_id": store_id,
            "role": "store_owner",
            "permissions": None,
            "is_active": True,
            "is_owner": True,
            "effective_permissions": merge_permissions("store_owner", None),
        }

    row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.store_user_roles
                WHERE store_id = :sid AND user_id = :uid AND is_active = TRUE
                """
            ),
            {"sid": store_id, "uid": user_id},
        )
    ).mappings().first()

    if row:
        r = dict(row)
        r["is_owner"] = False
        r["effective_permissions"] = merge_permissions(
            str(r["role"]), r.get("permissions") if isinstance(r.get("permissions"), dict) else None
        )
        return r

    if owner_id and user_id == owner_id:
        return {
            "user_id": user_id,
            "store_id": store_id,
            "role": "store_owner",
            "permissions": None,
            "is_active": True,
            "is_owner": True,
            "effective_permissions": merge_permissions("store_owner", None),
        }

    raise HTTPException(403, "Usuário sem acesso à loja")


async def list_team_users(session: AsyncSession, owner_id: str) -> list[dict[str, Any]]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    rows = (
        await session.execute(
            text(
                """
                SELECT r.*,
                       pp.display_name AS profile_name,
                       pp.handle
                FROM tcg_judge.store_user_roles r
                LEFT JOIN tcg_judge.player_profiles pp ON pp.id = r.user_id
                WHERE r.store_id = :sid
                ORDER BY r.created_at ASC
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    owner_entry = {
        "id": "owner",
        "user_id": owner_id,
        "store_id": store_id,
        "role": "store_owner",
        "display_name": store.get("name"),
        "invited_email": None,
        "is_active": True,
        "is_owner": True,
        "effective_permissions": merge_permissions("store_owner", None),
    }

    members = [owner_entry]
    for row in rows:
        r = dict(row)
        r["is_owner"] = False
        r["effective_permissions"] = merge_permissions(
            str(r["role"]),
            r.get("permissions") if isinstance(r.get("permissions"), dict) else None,
        )
        members.append(r)
    return members


async def invite_team_user(
    session: AsyncSession,
    owner_id: str,
    *,
    email: str,
    role: str,
    display_name: str | None = None,
) -> dict[str, Any]:
    if role not in VALID_ROLES or role == "store_owner":
        raise HTTPException(400, "Role inválida")
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    profile = (
        await session.execute(
            text(
                """
                SELECT id, display_name FROM tcg_judge.player_profiles
                WHERE LOWER(handle) = LOWER(:email_part)
                   OR id = :email
                LIMIT 1
                """
            ),
            {"email_part": email.split("@")[0], "email": email},
        )
    ).mappings().first()

    user_id = str(profile["id"]) if profile else f"pending:{uuid.uuid4()}"
    name = display_name or (profile["display_name"] if profile else email.split("@")[0])

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.store_user_roles (
                  store_id, user_id, role, invited_email, display_name
                ) VALUES (:sid, :uid, :role, :email, :name)
                ON CONFLICT (store_id, user_id) DO UPDATE SET
                  role = EXCLUDED.role,
                  invited_email = EXCLUDED.invited_email,
                  display_name = COALESCE(EXCLUDED.display_name, store_user_roles.display_name),
                  is_active = TRUE,
                  updated_at = NOW()
                RETURNING *
                """
            ),
            {"sid": store_id, "uid": user_id, "role": role, "email": email.lower(), "name": name},
        )
    ).mappings().first()

    await log_team_action(
        session,
        store_id,
        owner_id,
        action="team.invite",
        resource_type="team_user",
        resource_id=str(row["id"]) if row else user_id,
        details={"email": email, "role": role},
    )
    await session.commit()
    return dict(row) if row else {}


async def update_user_role(
    session: AsyncSession,
    owner_id: str,
    member_user_id: str,
    role: str,
) -> dict[str, Any]:
    if role not in VALID_ROLES or role == "store_owner":
        raise HTTPException(400, "Role inválida")
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.store_user_roles
                SET role = :role, updated_at = NOW()
                WHERE store_id = :sid AND user_id = :uid
                RETURNING *
                """
            ),
            {"role": role, "sid": store_id, "uid": member_user_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Membro não encontrado")
    await log_team_action(
        session,
        store_id,
        owner_id,
        action="team.role_update",
        resource_type="team_user",
        resource_id=member_user_id,
        details={"role": role},
    )
    await session.commit()
    return dict(row)


async def update_user_permissions(
    session: AsyncSession,
    owner_id: str,
    member_user_id: str,
    permissions: dict[str, Any],
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.store_user_roles
                SET permissions = CAST(:perms AS jsonb), updated_at = NOW()
                WHERE store_id = :sid AND user_id = :uid
                RETURNING *
                """
            ),
            {"perms": json.dumps(permissions), "sid": store_id, "uid": member_user_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Membro não encontrado")
    await log_team_action(
        session,
        store_id,
        owner_id,
        action="team.permissions_update",
        resource_type="team_user",
        resource_id=member_user_id,
    )
    await session.commit()
    r = dict(row)
    r["effective_permissions"] = merge_permissions(
        str(r["role"]),
        r.get("permissions") if isinstance(r.get("permissions"), dict) else None,
    )
    return r


async def list_audit_logs(
    session: AsyncSession,
    owner_id: str,
    *,
    user_id: str | None = None,
    action: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = 1,
    limit: int = 50,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    clauses = ["l.store_id = :sid"]
    params: dict[str, Any] = {
        "sid": store_id,
        "lim": min(100, max(1, limit)),
        "off": (max(1, page) - 1) * limit,
    }
    if user_id:
        clauses.append("l.user_id = :uid")
        params["uid"] = user_id
    if action:
        clauses.append("l.action ILIKE :act")
        params["act"] = f"%{action}%"
    if date_from:
        clauses.append("l.created_at >= :df")
        params["df"] = date_from.isoformat()
    if date_to:
        clauses.append("l.created_at <= :dt")
        params["dt"] = date_to.isoformat()

    where = " AND ".join(clauses)
    try:
        rows = (
            await session.execute(
                text(
                    f"""
                    SELECT l.*, pp.display_name AS actor_name
                    FROM tcg_judge.store_user_logs l
                    LEFT JOIN tcg_judge.player_profiles pp ON pp.id = l.user_id
                    WHERE {where}
                    ORDER BY l.created_at DESC
                    LIMIT :lim OFFSET :off
                    """
                ),
                params,
            )
        ).mappings().all()
        count = (
            await session.execute(
                text(f"SELECT COUNT(*) AS total FROM tcg_judge.store_user_logs l WHERE {where}"),
                {k: v for k, v in params.items() if k not in {"lim", "off"}},
            )
        ).mappings().first()
    except Exception:
        return {"logs": [], "total": 0, "page": page, "limit": limit}

    return {
        "logs": [dict(r) for r in rows],
        "total": int(count["total"]) if count else 0,
        "page": page,
        "limit": limit,
    }


async def log_team_action(
    session: AsyncSession,
    store_id: str,
    user_id: str,
    *,
    action: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    try:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.store_user_logs (
                  store_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent
                ) VALUES (
                  :sid, :uid, :action, :rtype, :rid, CAST(:details AS jsonb), :ip, :ua
                )
                """
            ),
            {
                "sid": store_id,
                "uid": user_id,
                "action": action,
                "rtype": resource_type,
                "rid": resource_id,
                "details": json.dumps(details or {}),
                "ip": ip_address,
                "ua": user_agent,
            },
        )
    except Exception:
        pass
