from evaluation.judge_quality.metrics import aggregate_results, compare_to_baseline, score_case
from evaluation.judge_quality.runner import run_fixture_evaluation, load_baseline


def test_score_case_accuracy():
    r = score_case(
        case_id="t",
        game_slug="mtg",
        expected_rule="702.19",
        top1_rule="702.19a",
        confidence=0.8,
        n_sources=2,
    )
    assert r.accuracy_at_1 is True
    assert r.source_coverage == 1.0


def test_ci_gate_passes_on_baseline():
    current = run_fixture_evaluation()
    baseline = load_baseline()
    ok, failures = compare_to_baseline(current, baseline)
    assert ok, failures
