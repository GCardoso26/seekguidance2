"""Convergência de caminhos."""

from app.reasoning.state_graph.convergence_detector import convergence_summary


def test_two_identical_paths_converge() -> None:
    p = ["event", "replacement", "sba"]
    r = convergence_summary([p, list(p)], "cleanup replacement sba", "mtg")
    assert r["converged_path_groups"] >= 1
