"""Resolução determinística reordena papéis."""

from app.reasoning.deterministic.deterministic_solver import solve_deterministic


def test_replacement_after_event() -> None:
    sol = solve_deterministic(["replacement", "sba", "event"], "mtg")
    assert sol["ok"]
    roles = sol["validated_roles"]
    assert roles.index("event") < roles.index("replacement")
    assert roles.index("replacement") < roles.index("sba")
