# PRODUCT_KNOWLEDGE_GRAPH_VALIDATION

**Date:** 2026-07-22  
**Result:** **FAIL**

## Desired graph

Publisher → Game → Expansion → Collection → Product → Variant → Contents → Specs → Relationships → Assets → Metadata → Marketing

## Observed

| Node | Count |
|------|------:|
| Publisher | 8 (seed only) |
| Game | 12 |
| Expansion / Collection / Product / Variant | 0 |
| Contents / Specs / Relationships / Packages / Metadata | 0 |

## Integrity checks

| Check | Result |
|-------|--------|
| Persistent UUIDs schema | ✅ |
| Orphans | N/A (empty) |
| Loops | N/A |
| Products without publisher | N/A |
| Links Marketplace → Product | ❌ 0 links |

## Wiring gap

Providers não chamam services de contents/specs/metadata (BUG-V4-009).

## Verdict

Grafo **não íntegro em produção** (vazio). Código estrutural presente.
