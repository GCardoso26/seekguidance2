"""Timer de rodada com Redis + fallback em memória."""

from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime
from typing import Any

from app.core.config import get_settings
from app.tournament.types import TimerStatus

_MEMORY_TIMERS: dict[str, dict[str, Any]] = {}
_pubsub_tasks: dict[str, asyncio.Task] = {}


def _redis_client():
    try:
        import redis

        url = get_settings().redis_url
        if not url:
            return None
        client = redis.Redis.from_url(url, decode_responses=True)
        client.ping()
        return client
    except Exception:
        return None


def _timer_key(round_id: str) -> str:
    return f"tournament:timer:{round_id}"


def _channel(round_id: str) -> str:
    return f"tournament:timer:channel:{round_id}"


class RoundTimer:
    def __init__(self, round_id: str, duration_minutes: int):
        self.round_id = round_id
        self.duration = duration_minutes * 60
        self.extensions = 0
        self.started_at: datetime | None = None
        self.status: TimerStatus = "pending"

    def remaining_seconds(self) -> int:
        if not self.started_at:
            return self.duration + self.extensions
        elapsed = (datetime.now(UTC) - self.started_at).total_seconds()
        return max(0, int(self.duration + self.extensions - elapsed))

    def to_dict(self) -> dict[str, Any]:
        return {
            "roundId": self.round_id,
            "status": self.status,
            "remainingSeconds": self.remaining_seconds(),
            "durationSeconds": self.duration,
            "extensionsSeconds": self.extensions,
            "startedAt": self.started_at.isoformat() if self.started_at else None,
        }

    def _persist(self) -> None:
        data = {
            "duration": self.duration,
            "extensions": self.extensions,
            "started_at": self.started_at.isoformat() if self.started_at else "",
            "status": self.status,
        }
        r = _redis_client()
        if r:
            try:
                r.hset(
                    _timer_key(self.round_id),
                    mapping={k: str(v) for k, v in data.items()},
                )
                return
            except Exception:
                pass
        _MEMORY_TIMERS[self.round_id] = data

    @classmethod
    def load(cls, round_id: str, duration_minutes: int) -> RoundTimer:
        timer = cls(round_id, duration_minutes)
        r = _redis_client()
        data = None
        if r:
            data = r.hgetall(_timer_key(round_id))
        elif round_id in _MEMORY_TIMERS:
            data = _MEMORY_TIMERS[round_id]
        if data:
            timer.duration = int(data.get("duration", timer.duration))
            timer.extensions = int(data.get("extensions", 0))
            timer.status = data.get("status", "pending")  # type: ignore[assignment]
            started = data.get("started_at")
            if started:
                timer.started_at = datetime.fromisoformat(started)
        return timer

    def start(self) -> dict[str, Any]:
        self.started_at = datetime.now(UTC)
        self.status = "running"
        self._persist()
        payload = {"type": "timer:started", **self.to_dict()}
        broadcast_timer_event(self.round_id, payload)
        return payload

    def extend(self, minutes: int) -> dict[str, Any]:
        self.extensions += minutes * 60
        self.status = "extended"
        self._persist()
        payload = {"type": "timer:extended", **self.to_dict()}
        broadcast_timer_event(self.round_id, payload)
        return payload

    def end(self) -> dict[str, Any]:
        self.status = "ended"
        self._persist()
        payload = {"type": "timer:ended", **self.to_dict()}
        broadcast_timer_event(self.round_id, payload)
        return payload

    def tick_payload(self) -> dict[str, Any]:
        remaining = self.remaining_seconds()
        event_type = "timer:tick"
        if remaining <= 300 and remaining > 0 and self.status == "running":
            event_type = "timer:warning"
        if remaining == 0 and self.status == "running":
            self.status = "ended"
            self._persist()
            event_type = "timer:ended"
        return {"type": event_type, **self.to_dict()}


def broadcast_timer_event(round_id: str, payload: dict[str, Any]) -> None:
    message = json.dumps(payload)
    r = _redis_client()
    if r:
        r.publish(_channel(round_id), message)
    _MEMORY_TIMERS.setdefault(f"last:{round_id}", {})["event"] = payload


def get_last_timer_event(round_id: str) -> dict[str, Any] | None:
    mem = _MEMORY_TIMERS.get(f"last:{round_id}", {})
    return mem.get("event")


async def subscribe_timer_events(round_id: str):
    """Async generator de eventos do timer (Redis pub/sub ou polling)."""
    r = _redis_client()
    if r:
        pubsub = r.pubsub()
        pubsub.subscribe(_channel(round_id))
        try:
            while True:
                msg = pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if msg and msg.get("data"):
                    yield json.loads(msg["data"])
                else:
                    timer = RoundTimer.load(round_id, duration_minutes=55)
                    yield timer.tick_payload()
                await asyncio.sleep(1)
        finally:
            pubsub.unsubscribe(_channel(round_id))
            pubsub.close()
    else:
        while True:
            timer = RoundTimer.load(round_id, duration_minutes=55)
            payload = timer.tick_payload()
            yield payload
            if payload.get("status") == "ended":
                break
            await asyncio.sleep(1)
