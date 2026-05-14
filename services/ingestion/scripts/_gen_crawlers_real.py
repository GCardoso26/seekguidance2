"""One-off generator for tcg_judge_ingestion.crawlers_real (run from repo)."""

from __future__ import annotations

from pathlib import Path

GAMES = ["mtg", "yugioh", "pokemon", "onepiece", "digimon", "fab", "lorcana", "riftbound"]

FILES: dict[str, str] = {
    "source_catalog.py": '''"""Catálogo declarativo de fontes (URLs reais em produção)."""
from __future__ import annotations

from typing import Any

GAME_SLUG = __GAME__


def catalog_entries() -> list[dict[str, Any]]:
    return [
        {"kind": "comprehensive_rules", "game": GAME_SLUG, "priority": 1.0, "url_template": None},
        {"kind": "rulings_archive", "game": GAME_SLUG, "priority": 0.95, "url_template": None},
        {"kind": "errata", "game": GAME_SLUG, "priority": 0.9, "url_template": None},
    ]
''',
    "crawler.py": '''"""Crawler publisher-grade — integra com `crawler.resilient_fetch`."""
from __future__ import annotations

from typing import Any

GAME_SLUG = __GAME__


def crawl_intent(*, url: str, etag: str | None = None) -> dict[str, Any]:
    return {"game": GAME_SLUG, "url": url, "etag": etag, "stage": "queued_stub"}
''',
    "parser.py": '''"""Parser bruto → metadados normalizados."""
from __future__ import annotations

from typing import Any

GAME_SLUG = __GAME__


def parse_blob(content_type: str, body: bytes) -> dict[str, Any]:
    return {"game": GAME_SLUG, "content_type": content_type, "bytes": len(body), "status": "stub"}
''',
    "policy_ingestion.py": '''"""Tournament policy / penalty guidelines."""
from __future__ import annotations

from typing import Any

GAME_SLUG = __GAME__


def policy_sources() -> list[dict[str, Any]]:
    return [{"kind": "tournament_policy", "game": GAME_SLUG}]
''',
    "rulings_ingestion.py": '''"""Rulings / judge blogs / FAQ."""
from __future__ import annotations

from typing import Any

GAME_SLUG = __GAME__


def rulings_sources() -> list[dict[str, Any]]:
    return [{"kind": "official_ruling", "game": GAME_SLUG}]
''',
    "historical_versions.py": '''"""Snapshots versionados."""
from __future__ import annotations

from typing import Any

GAME_SLUG = __GAME__


def version_manifest_stub(version_label: str) -> dict[str, Any]:
    return {"game": GAME_SLUG, "version_label": version_label, "immutable": True}
''',
    "errata_tracking.py": '''"""Errata / release notes."""
from __future__ import annotations

from typing import Any

GAME_SLUG = __GAME__


def errata_entry_stub(errata_id: str) -> dict[str, Any]:
    return {"game": GAME_SLUG, "errata_id": errata_id, "tracked": True}
''',
    "document_diffing.py": '''"""Diff semântico entre revisões."""
from __future__ import annotations

from typing import Any

GAME_SLUG = __GAME__


def diff_stub(a_hash: str, b_hash: str) -> dict[str, Any]:
    return {"game": GAME_SLUG, "a": a_hash, "b": b_hash, "method": "semantic_stub"}
''',
}


def main() -> None:
    root = Path(__file__).resolve().parents[1] / "tcg_judge_ingestion" / "crawlers_real"
    root.mkdir(parents=True, exist_ok=True)
    (root / "__init__.py").write_text(
        '"""Crawlers reais multi-TCG (incremental; não substitui `crawler/`)."""\n\n'
        "from tcg_judge_ingestion.crawlers_real.registry import list_game_slugs\n\n"
        '__all__ = ["list_game_slugs"]\n',
        encoding="utf-8",
    )
    reg = '''"""Registry de crawlers `crawlers_real`."""\nfrom __future__ import annotations\n\n'''
    reg += "GAME_SLUGS = [" + ", ".join(repr(g) for g in GAMES) + "]\n\n\n"
    reg += "def list_game_slugs() -> list[str]:\n    return list(GAME_SLUGS)\n"
    (root / "registry.py").write_text(reg, encoding="utf-8")
    for g in GAMES:
        d = root / g
        d.mkdir(parents=True, exist_ok=True)
        (d / "__init__.py").write_text(f'GAME_SLUG = "{g}"\n', encoding="utf-8")
        for name, tmpl in FILES.items():
            (d / name).write_text(tmpl.replace("__GAME__", repr(g)), encoding="utf-8")
    print("ok", root)


if __name__ == "__main__":
    main()
