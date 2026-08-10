"""Tournament Platform domain entities."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.tournament_platform.domain.enums import (
    CheckinMethod,
    JudgeStaffRole,
    PairingFormat,
    PenaltyType,
    PrizeType,
    RegistrationStatus,
    StoreEventStatus,
    StoreEventType,
    StoreEventVisibility,
)

__all__ = [
    "StoreEvent",
    "EventTicket",
    "EventRegistration",
    "CheckinRecord",
    "StaffAssignment",
    "PenaltyRecord",
    "PrizeAllocation",
    "DecklistArchive",
]


@dataclass
class StoreEvent:
    id: str
    store_id: str
    name: str
    description: str | None = None
    game: str | None = None
    format: str | None = None
    category: str | None = None
    event_type: StoreEventType = StoreEventType.TOURNAMENT
    capacity: int | None = None
    starts_at: str | None = None
    ends_at: str | None = None
    venue: str | None = None
    status: StoreEventStatus = StoreEventStatus.DRAFT
    visibility: StoreEventVisibility = StoreEventVisibility.PUBLIC
    image_url: str | None = None
    banner_url: str | None = None
    organizer_id: str | None = None
    rules: str | None = None
    policies: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "store_id": self.store_id,
            "name": self.name,
            "description": self.description,
            "game": self.game,
            "format": self.format,
            "category": self.category,
            "event_type": self.event_type.value,
            "capacity": self.capacity,
            "starts_at": self.starts_at,
            "ends_at": self.ends_at,
            "venue": self.venue,
            "status": self.status.value,
            "visibility": self.visibility.value,
            "image_url": self.image_url,
            "banner_url": self.banner_url,
            "organizer_id": self.organizer_id,
            "rules": self.rules,
            "policies": self.policies,
        }


@dataclass
class EventTicket:
    id: str
    store_event_id: str
    name: str = "Entry"
    price_cents: int = 0
    quantity: int = 0
    capacity: int | None = None
    availability: int | None = None
    lot: str | None = None
    sales_deadline: str | None = None
    require_checkin: bool = True
    online_payment_required: bool = False
    counter_payment_forbidden: bool = False
    store_product_id: str | None = None
    tournament_id: str | None = None
    currency: str = "BRL"
    status: str = "active"

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "store_event_id": self.store_event_id,
            "tournament_id": self.tournament_id,
            "name": self.name,
            "price_cents": self.price_cents,
            "quantity": self.quantity,
            "capacity": self.capacity,
            "availability": self.availability,
            "lot": self.lot,
            "sales_deadline": self.sales_deadline,
            "require_checkin": self.require_checkin,
            "online_payment_required": self.online_payment_required,
            "counter_payment_forbidden": self.counter_payment_forbidden,
            "store_product_id": self.store_product_id,
            "currency": self.currency,
            "status": self.status,
            "inventory_type": "EVENT",
        }


@dataclass
class EventRegistration:
    id: str
    store_event_id: str
    user_id: str
    status: RegistrationStatus = RegistrationStatus.PENDING_PAYMENT
    tournament_id: str | None = None
    ticket_id: str | None = None
    participant_id: str | None = None
    payment_ref: str | None = None
    qr_code: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "store_event_id": self.store_event_id,
            "tournament_id": self.tournament_id,
            "ticket_id": self.ticket_id,
            "user_id": self.user_id,
            "participant_id": self.participant_id,
            "status": self.status.value,
            "payment_ref": self.payment_ref,
            "qr_code": self.qr_code,
        }


@dataclass
class CheckinRecord:
    id: str
    registration_id: str
    method: CheckinMethod
    tournament_id: str | None = None
    actor_user_id: str | None = None
    actor_role: str | None = None
    notes: str | None = None
    created_at: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "registration_id": self.registration_id,
            "tournament_id": self.tournament_id,
            "method": self.method.value,
            "actor_user_id": self.actor_user_id,
            "actor_role": self.actor_role,
            "notes": self.notes,
            "created_at": self.created_at,
        }


@dataclass
class StaffAssignment:
    id: str
    user_id: str
    role: JudgeStaffRole
    tournament_id: str | None = None
    store_event_id: str | None = None
    status: str = "active"

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "role": self.role.value,
            "tournament_id": self.tournament_id,
            "store_event_id": self.store_event_id,
            "status": self.status,
        }


@dataclass
class PenaltyRecord:
    id: str
    tournament_id: str
    participant_user_id: str
    penalty_type: PenaltyType
    judge_user_id: str
    notes: str | None = None
    created_at: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "participant_user_id": self.participant_user_id,
            "penalty_type": self.penalty_type.value,
            "judge_user_id": self.judge_user_id,
            "notes": self.notes,
            "created_at": self.created_at,
        }


@dataclass
class PrizeAllocation:
    id: str
    tournament_id: str
    prize_type: PrizeType
    rank_from: int = 1
    rank_to: int = 1
    amount_cents: int | None = None
    points: int | None = None
    description: str | None = None
    product_ref: str | None = None
    auto_distribute: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "prize_type": self.prize_type.value,
            "rank_from": self.rank_from,
            "rank_to": self.rank_to,
            "amount_cents": self.amount_cents,
            "points": self.points,
            "description": self.description,
            "product_ref": self.product_ref,
            "auto_distribute": self.auto_distribute,
        }


@dataclass
class DecklistArchive:
    id: str
    tournament_id: str
    user_id: str
    source: str = "upload"
    file_name: str | None = None
    content_hash: str | None = None
    validation_status: str = "pending"
    deck_check_flag: bool = False
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "user_id": self.user_id,
            "source": self.source,
            "file_name": self.file_name,
            "content_hash": self.content_hash,
            "validation_status": self.validation_status,
            "deck_check_flag": self.deck_check_flag,
            "meta": self.meta,
            "parser": None,
        }


__all__ += [
    "StoreEventStatus",
    "StoreEventVisibility",
    "StoreEventType",
    "RegistrationStatus",
    "CheckinMethod",
    "JudgeStaffRole",
    "PenaltyType",
    "PrizeType",
    "PairingFormat",
]
