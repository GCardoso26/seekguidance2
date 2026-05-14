"""Delta de comportamento em mesa após errata (explicação jogável)."""

from __future__ import annotations


def behavior_delta_stub(card_id: str, rule_tag: str) -> dict[str, str]:
    return {
        "card_id": card_id,
        "rule_tag": rule_tag,
        "player_summary": "Releia a carta com o texto atualizado; priorize o CR/RR oficial.",
    }
