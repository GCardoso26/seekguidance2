"""Motor Swiss — geração de pairings."""

from __future__ import annotations

import math
import random
from collections import defaultdict

from app.tournament.engine.tiebreakers import sort_standings
from app.tournament.types import GeneratedPairing, PairingRecord, Participant


def recommended_swiss_rounds(player_count: int) -> int:
    if player_count < 2:
        return 0
    return max(3, math.ceil(math.log2(player_count)))


def _played_before(a: str, b: str, history: list[PairingRecord]) -> bool:
    for p in history:
        if p.is_bye:
            continue
        if {p.player1_id, p.player2_id} == {a, b}:
            return True
    return False


def _had_bye(participant_id: str, history: list[PairingRecord]) -> bool:
    for p in history:
        if p.is_bye and p.player1_id == participant_id:
            return True
    return False


class SwissEngine:
    def generate_pairings(
        self,
        round_number: int,
        participants: list[Participant],
        previous_pairings: list[PairingRecord],
        *,
        rng: random.Random | None = None,
    ) -> list[GeneratedPairing]:
        rng = rng or random.Random()
        active = [p for p in participants if p.is_active]
        if len(active) < 2 and not (len(active) == 1 and round_number > 1):
            if len(active) == 1:
                return [
                    GeneratedPairing(
                        player1_id=active[0].id,
                        player2_id=None,
                        table_number=1,
                        is_bye=True,
                    )
                ]
            return []

        if round_number == 1:
            shuffled = active[:]
            rng.shuffle(shuffled)
            return self._pair_list(shuffled, previous_pairings, start_table=1, rng=rng)

        ranked = sort_standings(active)
        score_groups: dict[int, list[Participant]] = defaultdict(list)
        for p in ranked:
            score_groups[p.match_points].append(p)

        unpaired: list[Participant] = []
        pairings: list[GeneratedPairing] = []
        table = 1

        scores_desc = sorted(score_groups.keys(), reverse=True)
        for score in scores_desc:
            group = score_groups[score] + unpaired
            unpaired = []
            group = sort_standings(group)
            used: set[str] = set()

            i = 0
            while i < len(group):
                p1 = group[i]
                if p1.id in used:
                    i += 1
                    continue
                partner: Participant | None = None
                forced = False
                for j in range(i + 1, len(group)):
                    p2 = group[j]
                    if p2.id in used:
                        continue
                    if not _played_before(p1.id, p2.id, previous_pairings):
                        partner = p2
                        break
                if partner is None:
                    for j in range(i + 1, len(group)):
                        p2 = group[j]
                        if p2.id in used:
                            continue
                        partner = p2
                        forced = True
                        break
                if partner:
                    used.add(p1.id)
                    used.add(partner.id)
                    pairings.append(
                        GeneratedPairing(
                            player1_id=p1.id,
                            player2_id=partner.id,
                            table_number=table,
                            is_forced_rematch=forced,
                        )
                    )
                    table += 1
                    i += 1
                else:
                    unpaired.append(p1)
                    i += 1

        if len(unpaired) % 2 == 1:
            bye_candidate = min(
                unpaired,
                key=lambda p: (
                    p.match_points,
                    p.had_bye or _had_bye(p.id, previous_pairings),
                    p.omw_percent,
                ),
            )
            unpaired = [p for p in unpaired if p.id != bye_candidate.id]
            pairings.append(
                GeneratedPairing(
                    player1_id=bye_candidate.id,
                    player2_id=None,
                    table_number=table,
                    is_bye=True,
                )
            )
            table += 1

        if unpaired:
            extra = self._pair_list(unpaired, previous_pairings, start_table=table, rng=rng)
            pairings.extend(extra)

        return pairings

    def _pair_list(
        self,
        players: list[Participant],
        history: list[PairingRecord],
        *,
        start_table: int,
        rng: random.Random,
    ) -> list[GeneratedPairing]:
        result: list[GeneratedPairing] = []
        table = start_table
        i = 0
        while i < len(players):
            if i + 1 >= len(players):
                result.append(
                    GeneratedPairing(
                        player1_id=players[i].id,
                        player2_id=None,
                        table_number=table,
                        is_bye=True,
                    )
                )
                break
            p1, p2 = players[i], players[i + 1]
            forced = _played_before(p1.id, p2.id, history)
            result.append(
                GeneratedPairing(
                    player1_id=p1.id,
                    player2_id=p2.id,
                    table_number=table,
                    is_forced_rematch=forced,
                )
            )
            table += 1
            i += 2
        return result
