"""Métricas de avaliação Judge (accuracy@1, confiança média, cobertura de fontes)."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class EvalCaseResult:
    case_id: str
    game_slug: str
    accuracy_at_1: bool
    confidence: float
    source_coverage: float
    integrity_status: str = "ok"


@dataclass
class GameMetrics:
    game_slug: str
    accuracy_at_1: float
    confidence_avg: float
    source_coverage: float
    n_cases: int
    integrity_status: str = "ok"


@dataclass
class EvalReport:
    games: dict[str, GameMetrics] = field(default_factory=dict)
    integrity_status: str = "ok"

    def to_dict(self) -> dict:
        return {
            "integrity_status": self.integrity_status,
            "games": {
                slug: {
                    "accuracy_at_1": m.accuracy_at_1,
                    "confidence_avg": m.confidence_avg,
                    "source_coverage": m.source_coverage,
                    "n_cases": m.n_cases,
                    "integrity_status": m.integrity_status,
                }
                for slug, m in self.games.items()
            },
        }


def score_case(
    *,
    case_id: str,
    game_slug: str,
    expected_rule: str,
    top1_rule: str | None,
    confidence: float,
    n_sources: int,
    min_sources_for_coverage: int = 1,
) -> EvalCaseResult:
    exp = (expected_rule or "").strip().lower()
    got = (top1_rule or "").strip().lower()
    hit = bool(exp) and (got == exp or got.startswith(exp) or exp in got)
    coverage = 1.0 if n_sources >= min_sources_for_coverage else 0.0
    return EvalCaseResult(
        case_id=case_id,
        game_slug=game_slug,
        accuracy_at_1=hit,
        confidence=max(0.0, min(1.0, float(confidence))),
        source_coverage=coverage,
    )


def aggregate_results(results: list[EvalCaseResult]) -> EvalReport:
    by_game: dict[str, list[EvalCaseResult]] = {}
    for r in results:
        by_game.setdefault(r.game_slug, []).append(r)

    report = EvalReport()
    for slug, rows in by_game.items():
        if not rows:
            continue
        report.games[slug] = GameMetrics(
            game_slug=slug,
            accuracy_at_1=sum(1 for x in rows if x.accuracy_at_1) / len(rows),
            confidence_avg=sum(x.confidence for x in rows) / len(rows),
            source_coverage=sum(x.source_coverage for x in rows) / len(rows),
            n_cases=len(rows),
        )
    return report


def compare_to_baseline(
    current: EvalReport,
    baseline: EvalReport,
    *,
    accuracy_drop_threshold: float = 0.05,
    min_confidence: float = 0.55,
    indexed_games: set[str] | None = None,
) -> tuple[bool, list[str]]:
    """Retorna (pass, mensagens de falha)."""
    failures: list[str] = []
    games = indexed_games or set(current.games.keys())

    for slug in games:
        cur = current.games.get(slug)
        base = baseline.games.get(slug)
        if cur is None:
            continue
        if cur.confidence_avg < min_confidence:
            failures.append(
                f"{slug}: confidence_avg {cur.confidence_avg:.3f} < {min_confidence}"
            )
        if base is None:
            continue
        delta = cur.accuracy_at_1 - base.accuracy_at_1
        if delta < -accuracy_drop_threshold:
            failures.append(
                f"{slug}: accuracy@1 caiu {abs(delta)*100:.1f}% "
                f"(baseline {base.accuracy_at_1:.3f} → atual {cur.accuracy_at_1:.3f})"
            )

    return (len(failures) == 0, failures)


def markdown_pr_table(current: EvalReport, baseline: EvalReport | None) -> str:
    lines = [
        "## Judge Evaluation",
        "",
        "| Game | Baseline acc@1 | Atual acc@1 | Delta | Conf. média | Cobertura |",
        "| ---- | -------------- | ----------- | ----- | ----------- | --------- |",
    ]
    for slug in sorted(current.games.keys()):
        cur = current.games[slug]
        base = baseline.games.get(slug) if baseline else None
        b_acc = f"{base.accuracy_at_1:.2f}" if base else "—"
        delta = ""
        if base:
            d = (cur.accuracy_at_1 - base.accuracy_at_1) * 100
            delta = f"{d:+.1f}%"
        lines.append(
            f"| {slug.upper()} | {b_acc} | {cur.accuracy_at_1:.2f} | {delta} | "
            f"{cur.confidence_avg:.2f} | {cur.source_coverage:.2f} |"
        )
    return "\n".join(lines)
