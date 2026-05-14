"""Arquivo histórico de replay com deduplicação simples."""

from __future__ import annotations


def dedupe_replays(replay_hashes: list[str]) -> list[str]:
    return sorted(set(replay_hashes))
