"""Domain enums — Tournament Platform."""

from __future__ import annotations

from enum import StrEnum


class StoreEventStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    REGISTRATION_OPEN = "registration_open"
    LIVE = "live"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class StoreEventVisibility(StrEnum):
    PUBLIC = "public"
    UNLISTED = "unlisted"
    PRIVATE = "private"


class StoreEventType(StrEnum):
    TOURNAMENT = "tournament"
    LEAGUE = "league"
    CASUAL = "casual"
    PREMIER = "premier"
    OTHER = "other"


class RegistrationStatus(StrEnum):
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"
    REGISTERED = "registered"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    PLAYING = "playing"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class CheckinMethod(StrEnum):
    MANUAL = "manual"
    QR = "qr"
    CODE = "code"
    LIST = "list"


class JudgeStaffRole(StrEnum):
    HEAD_JUDGE = "HEAD_JUDGE"
    FLOOR_JUDGE = "FLOOR_JUDGE"
    SCOREKEEPER = "SCOREKEEPER"
    ORGANIZER = "ORGANIZER"
    EVENT_MANAGER = "EVENT_MANAGER"


class PenaltyType(StrEnum):
    WARNING = "warning"
    GAME_LOSS = "game_loss"
    MATCH_LOSS = "match_loss"
    DQ = "dq"


class PrizeType(StrEnum):
    PRODUCT = "product"
    CREDIT = "credit"
    CASH = "cash"
    VOUCHER = "voucher"
    STORE_CREDIT = "store_credit"
    POINTS = "points"


class PairingFormat(StrEnum):
    """Supported + prepared formats. Only SWISS / SINGLE_ELIM fully wired to RC1."""

    SWISS = "SWISS"
    SINGLE_ELIMINATION = "SINGLE_ELIMINATION"
    DOUBLE_ELIMINATION = "DOUBLE_ELIMINATION"
    ROUND_ROBIN = "ROUND_ROBIN"
    COMMANDER_PODS = "COMMANDER_PODS"
    LEAGUE = "LEAGUE"
    CASUAL = "CASUAL"
    TEAM = "TEAM"
    DRAFT = "DRAFT"
    SEALED = "SEALED"


# Formats implemented by existing RC1 engine
IMPLEMENTED_PAIRING_FORMATS: frozenset[PairingFormat] = frozenset(
    {PairingFormat.SWISS, PairingFormat.SINGLE_ELIMINATION}
)

# Prepared architecture only
PREPARED_PAIRING_FORMATS: frozenset[PairingFormat] = frozenset(
    {
        PairingFormat.DOUBLE_ELIMINATION,
        PairingFormat.ROUND_ROBIN,
        PairingFormat.COMMANDER_PODS,
        PairingFormat.LEAGUE,
        PairingFormat.CASUAL,
        PairingFormat.TEAM,
        PairingFormat.DRAFT,
        PairingFormat.SEALED,
    }
)


REGISTRATION_TRANSITIONS: dict[RegistrationStatus, frozenset[RegistrationStatus]] = {
    RegistrationStatus.PENDING_PAYMENT: frozenset(
        {RegistrationStatus.PAID, RegistrationStatus.CANCELLED, RegistrationStatus.REFUNDED}
    ),
    RegistrationStatus.PAID: frozenset(
        {RegistrationStatus.REGISTERED, RegistrationStatus.CANCELLED, RegistrationStatus.REFUNDED}
    ),
    RegistrationStatus.REGISTERED: frozenset(
        {RegistrationStatus.CONFIRMED, RegistrationStatus.CANCELLED}
    ),
    RegistrationStatus.CONFIRMED: frozenset(
        {RegistrationStatus.CHECKED_IN, RegistrationStatus.NO_SHOW, RegistrationStatus.CANCELLED}
    ),
    RegistrationStatus.CHECKED_IN: frozenset({RegistrationStatus.PLAYING, RegistrationStatus.NO_SHOW}),
    RegistrationStatus.PLAYING: frozenset({RegistrationStatus.COMPLETED, RegistrationStatus.NO_SHOW}),
    RegistrationStatus.COMPLETED: frozenset(),
    RegistrationStatus.NO_SHOW: frozenset(),
    RegistrationStatus.CANCELLED: frozenset(),
    RegistrationStatus.REFUNDED: frozenset(),
}
