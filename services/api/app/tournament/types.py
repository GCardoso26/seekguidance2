"""Tipos do motor de torneio."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

ParticipantStatus = Literal["registered", "checked_in", "active", "dropped", "disqualified"]
PairingStatus = Literal["pending", "reported", "confirmed", "disputed"]
RoundStatus = Literal["pending", "active", "completed"]
TimerStatus = Literal["pending", "running", "paused", "extended", "ended"]

MATCH_WIN_POINTS = 3
MATCH_DRAW_POINTS = 1
BYE_OPPONENT_MWP = 33.333


@dataclass
class Participant:
    id: str
    user_id: str
    display_name: str
    status: ParticipantStatus = "registered"
    match_points: int = 0
    match_wins: int = 0
    match_losses: int = 0
    match_draws: int = 0
    game_wins: int = 0
    game_losses: int = 0
    game_draws: int = 0
    omw_percent: float = 0.0
    gw_percent: float = 0.0
    ogw_percent: float = 0.0
    had_bye: bool = False

    @property
    def is_active(self) -> bool:
        return self.status in ("checked_in", "active")

    @property
    def matches_played(self) -> int:
        return self.match_wins + self.match_losses + self.match_draws


@dataclass
class PairingRecord:
    id: str
    round_number: int
    table_number: int
    player1_id: str
    player2_id: str | None
    player1_wins: int = 0
    player2_wins: int = 0
    draws: int = 0
    status: PairingStatus = "pending"
    is_bye: bool = False
    is_forced_rematch: bool = False


@dataclass
class GeneratedPairing:
    player1_id: str
    player2_id: str | None
    table_number: int
    is_bye: bool = False
    is_forced_rematch: bool = False


@dataclass
class StandingRow:
    rank: int
    participant: Participant


@dataclass
class BracketMatch:
    id: str
    round_number: int
    match_number: int
    player1_id: str | None
    player2_id: str | None
    winner_id: str | None = None
    next_match_id: str | None = None
    table_number: int | None = None
    status: str = "pending"


@dataclass
class BracketState:
    id: str
    tournament_id: str
    top_cut: int
    format: str = "SINGLE_ELIMINATION"
    matches: list[BracketMatch] = field(default_factory=list)
