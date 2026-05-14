from app.rules.semantic_compiler.rule_compiler_v4 import compile_rule_text


def test_semantic_compiler_generates_ast() -> None:
    out = compile_rule_text("603.3b", "Whenever X happens, instead do Y.")
    assert out["rule_ast_generated"] is True
    assert isinstance(out["semantic_constraints"], list)
