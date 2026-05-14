"""Índice temporal de replay."""

from __future__ import annotations


def historical_replay_index(periods: list[str], hashes: list[str]) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for p, h in zip(periods, hashes, strict=False):
        out.setdefault(p, []).append(h)
    return out
