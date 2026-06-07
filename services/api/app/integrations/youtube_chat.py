"""Stub — bot de chat YouTube Live (!standings, !pairings)."""

from __future__ import annotations

from typing import Any


class YouTubeChatBot:
    async def connect(self, live_chat_id: str) -> None:
        self.live_chat_id = live_chat_id

    async def handle_command(self, command: str, tournament_id: str) -> str:
        if command == "!standings":
            return f"Standings do torneio {tournament_id} — use overlay Judge TCG"
        if command == "!pairings":
            return f"Pairings do torneio {tournament_id}"
        if command == "!timer":
            return "Timer disponível no overlay"
        return "Comandos: !standings !pairings !timer !bracket"
