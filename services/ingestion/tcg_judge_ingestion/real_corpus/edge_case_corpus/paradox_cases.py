"""Casos paradoxais (mensagem para assistente, não prova formal ao utilizador)."""

from __future__ import annotations


def paradox_hint_stub(description: str) -> dict[str, str]:
    return {
        "kind": "paradox_suspect",
        "assistant_guidance": "Explique os dois desfechos possíveis e peça confirmação ao CR/head judge.",
        "description": description[:200],
    }
