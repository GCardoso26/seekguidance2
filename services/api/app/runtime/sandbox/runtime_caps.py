"""Caps agregados runtime."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RuntimeCaps:
    max_graph_nodes: int = 4096
    max_chain_explosion: int = 256
    replay_max_steps: int = 512
