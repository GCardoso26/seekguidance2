# Plano de Remediação P0 → P1 (Platform V4)

**Data:** 2026-07-22  
**Política:** Auto-fix inicia pelos P0; P1 em seguida. Sem novo BC / novos eventos.

## Ordem de execução

```
P0-002 Bootstrap provider_registry
   ↓
P0-001 Popular product_catalog (manifests manufacturers + sealed quando possível)
   ↓
P0-013 Vincular store_products.master_variant_id + expor master_product_id no PDP
   ↓
P1-003/004 Auth admin + GET coverage read-only
   ↓
P1-009 Wire providers → contents/specs/metadata
   ↓
P1-005/011 E2E Knowledge + Search boost integration tests
```

## P0 — escopo do auto-fix (esta entrega)

| ID | Ação | Critério de saída |
|----|------|-------------------|
| BUG-V4-002 | Seed `provider_registry` via migration + script `--bootstrap` | `count(provider_registry) > 0` |
| BUG-V4-001 | Sync manufacturers (manifests locais) via `ProductCatalogSyncService` | `count(products) > 0` |
| BUG-V4-013 | JOIN `master_product_id` na shop API + linker por SKU/nome (cats accessory/sealed) | Sleeve/acessórios linkáveis; PDP recebe IDs |

### Nota sobre 14 878 listings

Quase todos são `category=single` (cartas). O Product Catalog mestre (V4) cobre **selados/acessórios**, não singles de cards. O P0-013 corrige o **caminho de vínculo** e o **contrato PDP**; não inventa mapeamento carta→accessory.

## P1 — fila (após P0)

| ID | Ação |
|----|------|
| BUG-V4-003 | `_require_admin` em admin product-catalog + BFF sessão |
| BUG-V4-004 | Snapshot coverage só em POST/scheduler; GET read-only |
| BUG-V4-009 | Universal Publisher mapeia contents/specs/metadata oficiais |
| BUG-V4-005 | Playwright Knowledge Panel |
| BUG-V4-011 | Integração HybridProductSearch boosts |

## Riscos

- Sync sealed depende de APIs externas (Scryfall/Pokémon…) — manufacturers usam manifests locais (prioridade P0).  
- Redis/BullMQ: sync P0 roda **inline** no script (não depende de fila).  
- Não expor secrets em logs.
