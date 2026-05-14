"""Alertas lógicos de explosão de ramos (pré-Prometheus)."""

from __future__ import annotations

from typing import Any


def branch_explosion_alerts(n_branches: int, cap: int) -> dict[str, Any]:
    ratio = n_branches / max(1, cap)
    return {
        "firing": ratio > 1.0,
        "severity": "warning" if ratio > 0.85 else "info",
        "assistant_note": "Reduza ramos exibidos e mostre apenas caminhos mais prováveis ao jogador.",
        "ratio": round(ratio, 4),
    }
