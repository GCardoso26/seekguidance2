
from jobs.rule_graph_builder import REFERENCE_PATTERNS


def test_see_rule_pattern():
    pat = REFERENCE_PATTERNS[0][0]
    m = pat.search("See rule 702.9a for flying.")
    assert m
    assert m.group(1) == "702.9a"
