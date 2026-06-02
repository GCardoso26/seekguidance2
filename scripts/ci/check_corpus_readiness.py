#!/usr/bin/env python3
"""
Verifica se o corpus de cada jogo está pronto para avaliação CI.

Consulta GET /runtime/judge/{game_slug}/status por jogo.
Jogos com rag_ready=false ou ingestion_job_pending=true são marcados SKIP_EVAL.
Exporta EVAL_SKIP_GAMES (CSV) para stdout e variável de ambiente no GitHub Actions.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any


def _fetch_status(base_url: str, game_slug: str, timeout: float = 15.0) -> dict[str, Any]:
    url = f"{base_url.rstrip('/')}/runtime/judge/{game_slug}/status"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


def check_games(
    game_slugs: list[str],
    *,
    base_url: str | None = None,
    mock_status: dict[str, dict[str, Any]] | None = None,
) -> tuple[list[str], list[str]]:
    """
    Retorna (ready_games, skip_games).
    mock_status permite testes offline: {game_slug: {rag_ready, ingestion_job_pending}}.
    """
    ready: list[str] = []
    skip: list[str] = []

    for slug in game_slugs:
        slug = slug.strip().lower()
        if not slug:
            continue
        try:
            if mock_status is not None:
                status = mock_status.get(slug, {"rag_ready": True, "ingestion_job_pending": False})
            elif base_url:
                status = _fetch_status(base_url, slug)
            else:
                status = {"rag_ready": True, "ingestion_job_pending": False}

            rag_ready = bool(status.get("rag_ready", False))
            pending = bool(status.get("ingestion_job_pending", False))
            if not rag_ready or pending:
                print(f"Skipping {slug} — reindexing in progress", file=sys.stderr)
                skip.append(slug)
            else:
                ready.append(slug)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            print(f"Skipping {slug} — status unavailable ({exc})", file=sys.stderr)
            skip.append(slug)

    return ready, skip


def main() -> int:
    parser = argparse.ArgumentParser(description="Check corpus readiness for judge eval CI")
    parser.add_argument(
        "--games",
        default=os.environ.get("EVAL_GAME_SLUGS", "mtg,pokemon,yugioh,lorcana,onepiece"),
        help="Comma-separated game slugs",
    )
    parser.add_argument(
        "--api-url",
        default=os.environ.get("JUDGE_API_URL", os.environ.get("API_URL", "")),
        help="Base URL of Judge API (empty = assume all ready for offline fixtures)",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON report to stdout")
    args = parser.parse_args()

    slugs = [s.strip() for s in args.games.split(",") if s.strip()]
    base = args.api_url.strip() or None
    ready, skip = check_games(slugs, base_url=base)

    skip_csv = ",".join(skip)
    # GitHub Actions: append to GITHUB_ENV
    gh_env = os.environ.get("GITHUB_ENV")
    if gh_env:
        with open(gh_env, "a", encoding="utf-8") as f:
            f.write(f"EVAL_SKIP_GAMES={skip_csv}\n")

    report = {"ready": ready, "skip": skip, "eval_skip_games": skip_csv}
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"EVAL_SKIP_GAMES={skip_csv}")
        print(f"Ready: {', '.join(ready) or 'none'}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
