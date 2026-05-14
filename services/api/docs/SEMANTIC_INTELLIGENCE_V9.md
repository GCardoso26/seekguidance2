## Formal Rule Intelligence Platform V9

### Semantic compiler architecture
- `app/rules/semantic_compiler/` implementa pipeline texto -> AST -> semântica -> IR-like.
- Componentes: parser, normalizer, AST builder, extractors de constraints/timing, inferência de dependências e builder de efeitos.

### Ontology model
- `app/ontology/` define entidades, taxonomias, herança, relações e registry.
- Ontologia inclui mapeamentos cross-TCG (MTG, Yu-Gi-Oh, Pokémon).

### Ambiguity system
- `app/rules/ambiguity/` detecta conflitos de wording, calcula incerteza e risco de divergência de interpretação.

### Dependency inference model
- `app/rules/inference/` infere dependências ocultas de timing, causalidade, relações semânticas e dependências procedurais.

### Semantic graph engine
- `app/graph/semantic_rule_graph.py`, `ontology_graph_builder.py`, `interaction_graph_engine.py`,
  `semantic_path_analysis.py`, `graph_semantic_similarity.py`.

### Semantic evolution tracking
- `app/rules/evolution/` detecta mudança semântica comportamental e estima estabilidade runtime semântica.

### Explainability V9
- Pipeline: `app/reasoning/semantic_intelligence_v9_pipeline.py`.
- Integração em `app/reasoning/engine.py` e exposição em `ChatResponse.reasoning_v9`.

### Benchmarks executados
- Extensão da `evaluation/canonical_suite/` com:
  - `semantic_inference_cases`
  - `ambiguity_resolution_cases`
  - `ontology_alignment_cases`
  - `hidden_dependency_cases`
  - `semantic_conflict_cases`
  - `procedural_semantics_cases`
  - `runtime_annotation_cases`
  - `semantic_evolution_cases`

### Testes adicionados
- `tests/semantic_intelligence/`:
  - `test_semantic_compiler.py`
  - `test_ontology_engine.py`
  - `test_ambiguity_detection.py`
  - `test_dependency_inference.py`
  - `test_semantic_graph.py`
  - `test_rule_evolution.py`
  - `test_runtime_annotations.py`
  - `test_cross_tcg_semantics.py`
- E2E atualizado com os 5 prompts obrigatórios V9.

### Métricas de estabilidade / segurança
- Limites explícitos no compilador semântico (`MAX_AST_DEPTH`, caps de tokens).
- Similaridade semântica e score de incerteza para monitorar drift/ambiguidade.

### Falhas encontradas e correções aplicadas
- Correções automáticas de estilo/import order com `ruff --fix`.

### Gaps restantes
1. Inferência ainda híbrida com heurísticas leves; falta parser semântico profundo orientado a gramática formal completa.
2. Ontologia ainda sem backend persistente versionado.
3. Comparação de evolução semântica pode ser enriquecida com replay traces reais por versão.

### Próximos passos recomendados
1. Integrar parser formal de clauses CR (com precedence grammar explícita).
2. Persistir ontologia e evolução em snapshots versionados por regra.
3. Conectar V9 com pipeline de validação diferencial V8 para detecção contínua de regressões semânticas.
