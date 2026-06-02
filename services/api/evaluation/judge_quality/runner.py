"""Runner de avaliação Judge para CI (fixtures + baseline)."""

from __future__ import annotations

import json
from pathlib import Path

from evaluation.judge_quality.metrics import (
    EvalReport,
    aggregate_results,
    compare_to_baseline,
    markdown_pr_table,
    score_case,
)

_ROOT = Path(__file__).resolve().parent
FIXTURES = _ROOT / "fixtures" / "cases.json"
BASELINE = _ROOT / "baselines" / "main.json"


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _report_from_dict(data: dict) -> EvalReport:
    from evaluation.judge_quality.metrics import GameMetrics

    report = EvalReport(integrity_status=data.get("integrity_status", "ok"))
    for slug, g in (data.get("games") or {}).items():
        report.games[slug] = GameMetrics(
            game_slug=slug,
            accuracy_at_1=float(g["accuracy_at_1"]),
            confidence_avg=float(g["confidence_avg"]),
            source_coverage=float(g["source_coverage"]),
            n_cases=int(g.get("n_cases", 0)),
            integrity_status=g.get("integrity_status", "ok"),
        )
    return report


def run_fixture_evaluation() -> EvalReport:
    payload = _load_json(FIXTURES)
    results = []
    for row in payload.get("cases", []):
        results.append(
            score_case(
                case_id=str(row["id"]),
                game_slug=str(row["game_slug"]),
                expected_rule=str(row.get("expected_rule", "")),
                top1_rule=row.get("top1_rule"),
                confidence=float(row.get("confidence", 0)),
                n_sources=int(row.get("n_sources", 0)),
            )
        )
    return aggregate_results(results)


def load_baseline() -> EvalReport:
    if not BASELINE.is_file():
        return EvalReport()
    return _report_from_dict(_load_json(BASELINE))


def run_ci_gate() -> int:
    current = run_fixture_evaluation()
    baseline = load_baseline()
    ok, failures = compare_to_baseline(current, baseline)
    print(markdown_pr_table(current, baseline))
    if failures:
        print("\n### Gates falharam\n")
        for f in failures:
            print(f"- {f}")
    out_path = _ROOT / "reports" / "latest.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(current.to_dict(), indent=2), encoding="utf-8")
    md_path = _ROOT / "reports" / "pr_comment.md"
    md_path.write_text(markdown_pr_table(current, baseline), encoding="utf-8")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(run_ci_gate())
