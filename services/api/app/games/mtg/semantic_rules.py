"""Semântica formal de alto nível por TCG (referência, não CR completo)."""

from __future__ import annotations

ZONES = ("HAND", "BATTLEFIELD", "GRAVEYARD", "STACK", "EXILE", "COMMAND")
APNAP = True
SBA = True
LAYERS = True
REPLACEMENT_SEMANTICS = "modify_event_before_sba"
