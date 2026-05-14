"""Grafo simples de linhagem de documento (versões encadeadas)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class VersionNode:
    version_label: str
    content_hash: str
    children: list[dict[str, Any]]


def attach_child(parent: VersionNode, child: VersionNode) -> None:
    parent.children.append({"label": child.version_label, "hash": child.content_hash})
