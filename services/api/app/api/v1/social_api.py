"""API social — amigos, mensagens, comunidades."""

from __future__ import annotations

import json
from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.social import communities, feedback, follows, friendships, messages, newsletter, notifications, posts
from fastapi import APIRouter, Header, WebSocket, WebSocketDisconnect
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


class PostCreateBody(BaseModel):
    community_id: str
    title: str = Field(min_length=3, max_length=300)
    content: str = Field(default="", max_length=10000)
    image_url: str | None = None
    image_urls: list[str] | None = None
    tags: list[str] | None = None


class PostReportBody(BaseModel):
    reason: str = Field(pattern="^(spam|offensive|incorrect|other)$")
    details: str | None = None


class NewsletterSubscribeBody(BaseModel):
    email: str
    tcg_ids: list[str] | None = None


class NewsletterCreateBody(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=1, max_length=50000)


class FeedbackCreateBody(BaseModel):
    type: str = Field(pattern="^(bug|suggestion|praise|other)$")
    subject: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    attachment_url: str | None = None
    priority: str = Field(default="low", pattern="^(low|medium|high)$")


class FeedbackStatusBody(BaseModel):
    status: str = Field(pattern="^(open|in_progress|resolved|closed)$")


class PostVoteBody(BaseModel):
    value: int = Field(ge=-1, le=1)


class CommentCreateBody(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    parent_id: str | None = None


class PushSubscribeBody(BaseModel):
    endpoint: str
    keys: dict[str, str]


class ExpoPushSubscribeBody(BaseModel):
    token: str = Field(min_length=10)
    platform: str | None = None


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


@router.get("/runtime/judge/social/communities/{community_id}")
async def get_community_endpoint(session: DbSession, community_id: str) -> dict[str, Any]:
    comm = await communities.get_community(session, community_id)
    if not comm:
        from fastapi import HTTPException

        raise HTTPException(404, "Comunidade não encontrada")
    return comm


@router.get("/runtime/judge/social/posts")
async def list_posts_endpoint(
    session: DbSession,
    community_id: str | None = None,
    author_id: str | None = None,
    tag: str | None = None,
    following: bool = False,
    sort: str = "hot",
    period: str = "all",
    cursor: str | None = None,
    limit: int = 30,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    mode = sort if sort in ("hot", "new", "top") else "hot"
    top_period = period if period in ("week", "month", "year", "all") else "all"
    following_uid = None
    if following:
        following_uid = _require_user(x_judge_user_id)
    return await posts.list_posts(
        session,
        community_id=community_id,
        author_id=author_id,
        following_user_id=following_uid,
        tag=tag,
        sort=mode,  # type: ignore[arg-type]
        period=top_period,  # type: ignore[arg-type]
        cursor=cursor,
        limit=min(limit, 50),
    )


@router.get("/runtime/judge/social/tags")
async def list_tags_endpoint(session: DbSession, q: str = "", limit: int = 20) -> list[str]:
    return await posts.list_tags(session, q=q, limit=min(limit, 50))


@router.post("/runtime/judge/social/posts")
async def create_post_endpoint(
    session: DbSession,
    body: PostCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await posts.create_post(
        session,
        user_id,
        community_id=body.community_id,
        title=body.title,
        content=body.content,
        image_url=body.image_url,
        image_urls=body.image_urls,
        tags=body.tags,
    )


@router.get("/runtime/judge/social/posts/{post_id}")
async def get_post_endpoint(session: DbSession, post_id: str) -> dict[str, Any]:
    post = await posts.get_post(session, post_id)
    if not post:
        from fastapi import HTTPException

        raise HTTPException(404, "Post não encontrado")
    return post


@router.post("/runtime/judge/social/posts/{post_id}/vote")
async def vote_post_endpoint(
    session: DbSession,
    post_id: str,
    body: PostVoteBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    if body.value == 0:
        from fastapi import HTTPException

        raise HTTPException(400, "Valor de voto inválido")
    return await posts.vote_post(session, post_id, user_id, body.value)


@router.get("/runtime/judge/social/posts/{post_id}/comments")
async def list_comments_endpoint(session: DbSession, post_id: str) -> list[dict[str, Any]]:
    return await posts.list_comments(session, post_id)


@router.post("/runtime/judge/social/posts/{post_id}/comments")
async def create_comment_endpoint(
    session: DbSession,
    post_id: str,
    body: CommentCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await posts.create_comment(
        session,
        user_id,
        post_id=post_id,
        content=body.content,
        parent_id=body.parent_id,
    )


@router.post("/runtime/judge/social/posts/{post_id}/save")
async def save_post_endpoint(
    session: DbSession,
    post_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, bool]:
    user_id = _require_user(x_judge_user_id)
    return await posts.toggle_saved_post(session, post_id, user_id)


@router.post("/runtime/judge/social/posts/{post_id}/report")
async def report_post_endpoint(
    session: DbSession,
    post_id: str,
    body: PostReportBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await posts.report_post(session, post_id, user_id, reason=body.reason, details=body.details)


@router.get("/runtime/judge/social/follows/{player_id}/status")
async def follow_status_endpoint(
    session: DbSession,
    player_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    viewer_id = x_judge_user_id.strip() if x_judge_user_id else None
    return await follows.get_follow_stats(session, player_id, viewer_id)


@router.post("/runtime/judge/social/follows/{player_id}")
async def toggle_follow_endpoint(
    session: DbSession,
    player_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, bool]:
    user_id = _require_user(x_judge_user_id)
    return await follows.toggle_follow(session, user_id, player_id)


@router.post("/runtime/judge/social/newsletter/subscribe")
async def newsletter_subscribe_endpoint(
    session: DbSession,
    body: NewsletterSubscribeBody,
) -> dict[str, Any]:
    return await newsletter.subscribe(session, email=body.email, tcg_ids=body.tcg_ids)


@router.get("/runtime/judge/social/newsletter/archive")
async def newsletter_archive_endpoint(session: DbSession) -> list[dict[str, Any]]:
    return await newsletter.list_archive(session)


@router.post("/runtime/judge/social/newsletter")
async def newsletter_create_endpoint(
    session: DbSession,
    body: NewsletterCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await newsletter.create_draft(session, title=body.title, content=body.content)


@router.post("/runtime/judge/social/newsletter/{newsletter_id}/send")
async def newsletter_send_endpoint(
    session: DbSession,
    newsletter_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await newsletter.mark_sent(session, newsletter_id)


@router.post("/runtime/judge/social/feedback")
async def feedback_create_endpoint(
    session: DbSession,
    body: FeedbackCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = x_judge_user_id.strip() if x_judge_user_id else None
    return await feedback.create_feedback(
        session,
        user_id=user_id,
        type=body.type,  # type: ignore[arg-type]
        subject=body.subject,
        description=body.description,
        attachment_url=body.attachment_url,
        priority=body.priority,
    )


@router.get("/runtime/judge/social/feedback/mine")
async def feedback_mine_endpoint(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> list[dict[str, Any]]:
    user_id = _require_user(x_judge_user_id)
    return await feedback.list_user_feedbacks(session, user_id)


@router.get("/runtime/judge/social/feedback")
async def feedback_list_endpoint(
    session: DbSession,
    status: str | None = None,
    priority: str | None = None,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> list[dict[str, Any]]:
    _require_user(x_judge_user_id)
    return await feedback.list_all_feedbacks(session, status=status, priority=priority)


@router.patch("/runtime/judge/social/feedback/{feedback_id}")
async def feedback_update_endpoint(
    session: DbSession,
    feedback_id: str,
    body: FeedbackStatusBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await feedback.update_status(session, feedback_id, body.status)  # type: ignore[arg-type]


@router.get("/runtime/judge/social/notifications")
async def notifications_list_endpoint(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> list[dict[str, Any]]:
    user_id = _require_user(x_judge_user_id)
    return await notifications.list_recent(session, user_id)


@router.get("/runtime/judge/social/notifications/unread-count")
async def notifications_unread_endpoint(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, int]:
    user_id = _require_user(x_judge_user_id)
    count = await notifications.unread_count(session, user_id)
    return {"count": count}


@router.post("/runtime/judge/social/notifications/{notification_id}/read")
async def notifications_read_endpoint(
    session: DbSession,
    notification_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, bool]:
    user_id = _require_user(x_judge_user_id)
    return await notifications.mark_read(session, user_id, notification_id)


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


@router.post("/runtime/judge/notifications/expo-subscribe")
async def expo_push_subscribe(
    session: DbSession,
    body: ExpoPushSubscribeBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, bool]:
    from app.notifications.expo_push import expo_push_service

    user_id = _require_user(x_judge_user_id)
    platform = body.platform if body.platform in ("ios", "android", "web") else None
    await expo_push_service.save_token(session, user_id, token=body.token, platform=platform)
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
