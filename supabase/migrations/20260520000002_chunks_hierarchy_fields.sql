-- Campos opcionais de hierarquia de regras (complementam rule_path, hierarchy_level, title existentes)

ALTER TABLE tcg_judge.chunks
  ADD COLUMN IF NOT EXISTS rule_section TEXT,
  ADD COLUMN IF NOT EXISTS rule_subsection TEXT,
  ADD COLUMN IF NOT EXISTS rule_atom TEXT,
  ADD COLUMN IF NOT EXISTS rule_depth INT,
  ADD COLUMN IF NOT EXISTS rule_title TEXT;

CREATE INDEX IF NOT EXISTS chunks_rule_section_idx
  ON tcg_judge.chunks (rule_section)
  WHERE rule_section IS NOT NULL;

COMMENT ON COLUMN tcg_judge.chunks.rule_atom IS
  'Identificador atômico da regra (ex: 702.9a). Espelha rule_path quando aplicável.';
COMMENT ON COLUMN tcg_judge.chunks.rule_depth IS
  'Profundidade hierárquica: 0=capítulo, 1=seção, 2+=sub-regra.';
