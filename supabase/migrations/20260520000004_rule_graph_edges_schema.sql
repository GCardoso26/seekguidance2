-- Wave 2A: índices e metadados para rule_graph_edges auto-gerados
-- Não altera migrations anteriores; complementa metadata JSONB existente.

CREATE INDEX IF NOT EXISTS idx_rule_graph_edges_confidence_filter
  ON tcg_judge.rule_graph_edges (
    (COALESCE(NULLIF(metadata->>'confidence', '')::float, 0.0))
  )
  WHERE COALESCE(NULLIF(metadata->>'confidence', '')::float, 0.0) >= 0.70;

CREATE INDEX IF NOT EXISTS idx_rule_graph_edges_auto_source
  ON tcg_judge.rule_graph_edges ((metadata->>'source'))
  WHERE metadata->>'source' = 'auto_generated';

COMMENT ON COLUMN tcg_judge.rule_graph_edges.metadata IS
  'JSON: confidence, source (manual|auto_generated|rule_graph_builder), extracted_text';
