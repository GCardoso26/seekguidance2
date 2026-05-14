"""Interacções abstractas (stack vs chain)."""

from __future__ import annotations

from typing import Literal

InteractionShape = Literal["lifo_stack", "chain_reverse", "simultaneous_batch", "unknown"]
