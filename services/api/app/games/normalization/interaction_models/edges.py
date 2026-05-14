"""Modelo leve de interações (arestas simbólicas)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class InteractionEdge:
    src: str
    dst: str
    rel: str


def default_edges(game_slug: str) -> list[InteractionEdge]:
    g = game_slug.lower()
    if g == "mtg":
        return [
            InteractionEdge("trigger", "stack", "waits"),
            InteractionEdge("replacement", "event", "modifies"),
        ]
    if g == "yugioh":
        return [InteractionEdge("activation", "chain", "builds")]
    return [InteractionEdge("action", "resolution", "feeds")]
