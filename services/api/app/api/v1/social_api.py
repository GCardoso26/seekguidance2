"""API social — amigos, mensagens, comunidades."""

from __future__ import annotations

import json
from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.social import communities, friendships, messages
from fastapi import APIRouter, Header, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

router = APIRouter(tags=["social"])

_chat_connections: dict[str, set[WebSocket]] = {}


class FriendRequestBody(BaseModel):
    player_id: str


class MessageBody(BaseModel):
    receiver_id: str
    content: str = Field(min_length=1, max_length=2000)


class CommunityCreateBody(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    description: str | None = None
    game_code: str | None = None


class PushSubscribeBody(BaseModel):
    endpoint: str
    keys: dict[str, str]


@router.get("/runtime/judge/social/friends")
async def list_friends(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> list[dict[str, Any]]:
    user_id = _require_user(x_judge_user_id)
    friends = await friendships.list_friends(session, user_id)
    unread = await messages.unread_counts(session, user_id)
    for f in friends:
        f["unread"] = unread.get(f["id"], 0)
    return friends


@router.get("/runtime/judge/social/friends/pending")
async def list_pending_friends(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> list[dict[str, Any]]:
    user_id = _require_user(x_judge_user_id)
    return await friendships.list_pending_requests(session, user_id)


@router.get("/runtime/judge/social/friends/{player_id}/status")
async def friendship_status(
    session: DbSession,
    player_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, str]:
    user_id = _require_user(x_judge_user_id)
    status = await friendships.get_friendship_status(session, user_id, player_id)
    return {"status": status}


@router.post("/runtime/judge/social/friends/request")
async def friend_request(
    session: DbSession,
    body: FriendRequestBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await friendships.send_friend_request(session, user_id, body.player_id)


@router.post("/runtime/judge/social/friends/{player_id}/accept")
async def accept_friend(
    session: DbSession,
    player_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await friendships.accept_friend_request(session, user_id, player_id)


@router.delete("/runtime/judge/social/friends/{player_id}")
async def remove_friend(
    session: DbSession,
    player_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, bool]:
    user_id = _require_user(x_judge_user_id)
    await friendships.remove_friendship(session, user_id, player_id)
    return {"removed": True}


@router.get("/runtime/judge/social/messages/{other_id}")
async def get_messages(
    session: DbSession,
    other_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> list[dict[str, Any]]:
    user_id = _require_user(x_judge_user_id)
    await messages.mark_read(session, user_id, other_id)
    return await messages.get_conversation(session, user_id, other_id)


@router.post("/runtime/judge/social/messages")
async def post_message(
    session: DbSession,
    body: MessageBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    msg = await messages.send_message(session, user_id, body.receiver_id, body.content)
    for ws in _chat_connections.get(body.receiver_id, set()):
        try:
            await ws.send_json({"type": "message", "payload": msg})
        except Exception:
            pass
    return msg


@router.get("/runtime/judge/social/communities")
async def list_communities_endpoint(session: DbSession) -> list[dict[str, Any]]:
    return await communities.list_communities(session)


@router.post("/runtime/judge/social/communities")
async def create_community_endpoint(
    session: DbSession,
    body: CommunityCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await communities.create_community(
        session,
        user_id,
        name=body.name,
        description=body.description,
        game_code=body.game_code,
    )


@router.post("/runtime/judge/social/communities/{community_id}/join")
async def join_community_endpoint(
    session: DbSession,
    community_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await communities.join_community(session, community_id, user_id)


@router.get("/runtime/judge/social/communities/{community_id}/members")
async def community_members(session: DbSession, community_id: str) -> list[dict[str, Any]]:
    return await communities.list_members(session, community_id)


@router.post("/runtime/judge/notifications/subscribe")
async def push_subscribe(
    session: DbSession,
    body: PushSubscribeBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, bool]:
    from app.notifications.push import web_push_service

    user_id = _require_user(x_judge_user_id)
    keys = body.keys
    await web_push_service.save_subscription(
        session,
        user_id,
        endpoint=body.endpoint,
        p256dh=keys.get("p256dh", ""),
        auth=keys.get("auth", ""),
    )
    return {"subscribed": True}


@router.websocket("/runtime/judge/social/ws")
async def chat_websocket(websocket: WebSocket) -> None:
    user_id = websocket.headers.get("x-judge-user-id", "").strip()
    if not user_id:
        await websocket.close(code=4401)
        return
    await websocket.accept()
    _chat_connections.setdefault(user_id, set()).add(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        _chat_connections.get(user_id, set()).discard(websocket)
