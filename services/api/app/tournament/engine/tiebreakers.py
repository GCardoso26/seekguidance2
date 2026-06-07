"""Cálculo de tiebreakers: OMW%, GW%, OGW%."""

from __future__ import annotations

from app.tournament.types import BYE_OPPONENT_MWP, MATCH_DRAW_POINTS, MATCH_WIN_POINTS, Participant, PairingRecord


def match_win_percent(participant: Participant) -> float:
    played = participant.matches_played
    if played == 0:
        return 0.0
    points = (
        participant.match_wins * MATCH_WIN_POINTS
        + participant.match_draws * MATCH_DRAW_POINTS
    )
    max_points = played * MATCH_WIN_POINTS
    return (points / max_points) * 100.0 if max_points else 0.0


def game_win_percent(participant: Participant) -> float:
    total = participant.game_wins + participant.game_losses + participant.game_draws
    if total == 0:
        return 0.0
    return (participant.game_wins / total) * 100.0


def _opponent_ids(
    participant_id: str,
    pairings: list[PairingRecord],
    *,
    confirmed_only: bool = True,
) -> list[str]:
    opponents: list[str] = []
    for p in pairings:
        if confirmed_only and p.status != "confirmed":
            continue
        if p.is_bye:
            if p.player1_id == participant_id:
                continue
            continue
        if p.player1_id == participant_id and p.player2_id:
            opponents.append(p.player2_id)
        elif p.player2_id == participant_id:
            opponents.append(p.player1_id)
    return opponents


def opponent_match_win_percent(
    participant_id: str,
    participants: dict[str, Participant],
    pairings: list[PairingRecord],
) -> float:
    opp_ids = _opponent_ids(participant_id, pairings)
    if not opp_ids:
        return 0.0
    total = 0.0
    for oid in opp_ids:
        opp = participants.get(oid)
        if not opp:
            continue
        total += match_win_percent(opp)
    return total / len(opp_ids)


def opponent_game_win_percent(
    participant_id: str,
    participants: dict[str, Participant],
    pairings: list[PairingRecord],
) -> float:
    opp_ids = _opponent_ids(participant_id, pairings)
    if not opp_ids:
        return 0.0
    total = 0.0
    for oid in opp_ids:
        opp = participants.get(oid)
        if not opp:
            continue
        total += game_win_percent(opp)
    return total / len(opp_ids)


def recalculate_tiebreakers(
    participants: dict[str, Participant],
    pairings: list[PairingRecord],
) -> None:
    for pid, p in participants.items():
        p.gw_percent = round(game_win_percent(p), 3)
        p.omw_percent = round(opponent_match_win_percent(pid, participants, pairings), 3)
        p.ogw_percent = round(opponent_game_win_percent(pid, participants, pairings), 3)


def sort_standings(participants: list[Participant]) -> list[Participant]:
    return sorted(
        participants,
        key=lambda p: (
            -p.match_points,
            -p.omw_percent,
            -p.gw_percent,
            -p.ogw_percent,
            p.display_name.lower(),
        ),
    )


def apply_match_result(
    pairing: PairingRecord,
    participants: dict[str, Participant],
    *,
    player1_wins: int,
    player2_wins: int,
    draws: int = 0,
) -> None:
    p1 = participants[pairing.player1_id]
    if pairing.is_bye or not pairing.player2_id:
        p1.match_points += MATCH_WIN_POINTS
        p1.match_wins += 1
        p1.game_wins += 2
        p1.had_bye = True
        pairing.player1_wins = 2
        pairing.status = "confirmed"
        return

    p2 = participants[pairing.player2_id]
    p1.game_wins += player1_wins
    p1.game_losses += player2_wins
    p1.game_draws += draws
    p2.game_wins += player2_wins
    p2.game_losses += player1_wins
    p2.game_draws += draws

    if player1_wins > player2_wins:
        p1.match_points += MATCH_WIN_POINTS
        p1.match_wins += 1
        p2.match_losses += 1
    elif player2_wins > player1_wins:
        p2.match_points += MATCH_WIN_POINTS
        p2.match_wins += 1
        p1.match_losses += 1
    else:
        p1.match_points += MATCH_DRAW_POINTS
        p2.match_points += MATCH_DRAW_POINTS
        p1.match_draws += 1
        p2.match_draws += 1

    pairing.player1_wins = player1_wins
    pairing.player2_wins = player2_wins
    pairing.draws = draws
    pairing.status = "confirmed"
