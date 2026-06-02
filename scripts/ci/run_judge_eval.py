#!/usr/bin/env python3
"""
Executa avaliação Judge para CI: fixtures offline ou queries live contra a API.

Métricas por jogo: accuracy@1, confidence_avg, source_coverage.
Gates: accuracy@1 não cai >5% vs baseline; confidence_avg >= 0.55.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API_ROOT = ROOT / "services" / "api"
sys.path.insert(0, str(API_ROOT))

from evaluation.judge_quality.metrics import (  # noqa: E402
    EvalReport,
    aggregate_results,
    compare_to_baseline,
    markdown_pr_table,
    score_case,
)
from evaluation.judge_quality.runner import _report_from_dict, load_baseline  # noqa: E402

FIXTURES = API_ROOT / "evaluation" / "judge_quality" / "fixtures" / "cases.json"
BASELINE_TESTS = ROOT / "tests" / "judge_quality" / "baseline.json"
BASELINE_EVAL = API_ROOT / "evaluation" / "judge_quality" / "baselines" / "main.json"
REPORTS = API_ROOT / "evaluation" / "judge_quality" / "reports"


def _load_baseline() -> EvalReport:
    for path in (BASELINE_TESTS, BASELINE_EVAL):
        if path.is_file():
            return _report_from_dict(json.loads(path.read_text(encoding="utf-8")))
    return EvalReport()


def _skip_games() -> set[str]:
    raw = os.environ.get("EVAL_SKIP_GAMES", "")
    return {s.strip().lower() for s in raw.split(",") if s.strip()}


def _rule_from_sources(sources: list[dict]) -> str | None:
    if not sources:
        return None
    top = sources[0]
    return (
        top.get("rule_atom")
        or top.get("rule_path")
        or top.get("section")
        or ""
    ).strip() or None


def _live_query(base_url: str, game_slug: str, question: str, tcg: str) -> dict:
    url = f"{base_url.rstrip('/')}/runtime/judge/query"
    body = json.dumps({"tcg": tcg, "question": question}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode())


def _tcg_for_slug(slug: str) -> str:
    mapping = {
        "mtg": "magic",
        "pokemon": "pokemon",
        "yugioh": "yugioh",
        "lorcana": "lorcana",
        "onepiece": "one_piece",
    }
    return mapping.get(slug, slug)


def run_fixture_evaluation(skip: set[str]) -> EvalReport:
    payload = json.loads(FIXTURES.read_text(encoding="utf-8"))
    results = []
    for row in payload.get("cases", []):
        slug = str(row["game_slug"]).lower()
        if slug in skip:
            continue
        results.append(
            score_case(
                case_id=str(row["id"]),
                game_slug=slug,
                expected_rule=str(row.get("expected_rule", "")),
                top1_rule=row.get("top1_rule"),
                confidence=float(row.get("confidence", 0)),
                n_sources=int(row.get("n_sources", 0)),
            )
        )
    return aggregate_results(results)


def run_live_evaluation(base_url: str, skip: set[str]) -> EvalReport:
    payload = json.loads(FIXTURES.read_text(encoding="utf-8"))
    results = []
    for row in payload.get("cases", []):
        slug = str(row["game_slug"]).lower()
        if slug in skip:
            continue
        try:
            resp = _live_query(
                base_url,
                slug,
                str(row["question"]),
                _tcg_for_slug(slug),
            )
            top1 = _rule_from_sources(resp.get("sources") or [])
            results.append(
                score_case(
                    case_id=str(row["id"]),
                    game_slug=slug,
                    expected_rule=str(row.get("expected_rule", "")),
                    top1_rule=top1,
                    confidence=float(resp.get("confidence", 0)),
                    n_sources=len(resp.get("sources") or []),
                )
            )
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            print(f"Live eval failed for {row['id']}: {exc}", file=sys.stderr)
            results.append(
                score_case(
                    case_id=str(row["id"]),
                    game_slug=slug,
                    expected_rule=str(row.get("expected_rule", "")),
                    top1_rule=None,
                    confidence=0.0,
                    n_sources=0,
                )
            )
    return aggregate_results(results)


def markdown_with_skip(current: EvalReport, baseline: EvalReport, skip: set[str]) -> str:
    lines = [
        "## Judge Evaluation — Wave 2A CI",
        "",
        "| Jogo | Baseline acc@1 | Atual acc@1 | Delta | Status |",
        "|------|----------------|-------------|-------|--------|",
    ]
    for slug in sorted(set(current.games.keys()) | skip):
        if slug in skip:
            lines.append(f"| {slug} | SKIP | SKIP | — | ⏭ reindexing |")
            continue
        cur = current.games[slug]
        base = baseline.games.get(slug)
        b_acc = f"{base.accuracy_at_1:.2f}" if base else "—"
        delta = ""
        status = "✅"
        if base:
            d = (cur.accuracy_at_1 - base.accuracy_at_1) * 100
            delta = f"{d:+.1f}%"
            if d < -5.0:
                status = "❌"
        if cur.confidence_avg < 0.55:
            status = "❌"
        lines.append(
            f"| {slug} | {b_acc} | {cur.accuracy_at_1:.2f} | {delta} | {status} |"
        )
    conf_parts = [
        f"{slug}={current.games[slug].confidence_avg:.2f}"
        for slug in sorted(current.games.keys())
        if slug not in skip
    ]
    if conf_parts:
        lines.extend(["", f"confidence_avg: {', '.join(conf_parts)}"])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--api-url",
        default=os.environ.get("JUDGE_API_URL", os.environ.get("API_URL", "")),
    )
    parser.add_argument("--live", action="store_true", help="Query live API instead of fixtures")
    args = parser.parse_args()

    skip = _skip_games()
    baseline = _load_baseline()

    if args.live and args.api_url.strip():
        current = run_live_evaluation(args.api_url.strip(), skip)
    else:
        current = run_fixture_evaluation(skip)

    indexed = set(current.games.keys()) - skip
    ok, failures = compare_to_baseline(current, baseline, indexed_games=indexed)

    md = markdown_with_skip(current, baseline, skip)
    print(md)
    if failures:
        print("\n### Gates falharam\n", file=sys.stderr)
        for f in failures:
            print(f"- {f}", file=sys.stderr)

    REPORTS.mkdir(parents=True, exist_ok=True)
    (REPORTS / "latest.json").write_text(
        json.dumps(current.to_dict(), indent=2), encoding="utf-8"
    )
    (REPORTS / "pr_comment.md").write_text(md, encoding="utf-8")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
