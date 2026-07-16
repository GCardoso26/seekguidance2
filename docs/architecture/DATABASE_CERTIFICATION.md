# Database Certification

**Gate:** obrigatório **antes do primeiro Scryfall SHADOW** (e antes de qualquer provider escrever em ambiente compartilhado).  
**Diferença:** Contract Tests validam **comportamento** dos adapters; esta certificação valida **infraestrutura** PostgreSQL.

Checklist implementável: `services/api/scripts/database-certification.md` + runner `npm run certify:db` (quando `DATABASE_URL` estiver definido).

## Checklist

### Migrations

- [ ] Todas as migrations aplicam em banco limpo (`supabase db reset` / pipeline)
- [ ] Todas as migrations são **reversíveis** (down / rollback testado) ou documentadas como expand-contract
- [ ] Ordem: schemas domínio → outbox → guardrails (`row_version`, `committed_at`)

### Schema / constraints

- [ ] Índices esperados existem (`provider_mappings`, outbox claim, consumer_offsets, …)
- [ ] Constraints / CHECKs existem (`outbox.status`, `provider_object_type`, …)
- [ ] FKs Catalog existem (cards→sets/games, variants→cards, mappings→…)
- [ ] `row_version` presente nos aggregates de Catalog e incrementa em UPDATE

### Outbox / concorrência

- [ ] `FOR UPDATE SKIP LOCKED` funciona no claim do Outbox (dois workers não claimam a mesma row)
- [ ] Lease: worker morto → outro recupera após `lease_until`
- [ ] Payload imutável (sem UPDATE de `payload`)
- [ ] Advisory lock — se/quando utilizado, certificado no mesmo script

### Performance mínima (smoke)

- [ ] Persist Card p50 dentro do [Performance Budget](./FOUNDATION_FREEZE.md#15-foundation-closed--operational-gates)
- [ ] Claim Outbox batch (limit 100) dentro do budget
- [ ] Sem sequential scan óbvio nas queries de claim (EXPLAIN opcional no runner)

### Assinatura

| Item | Responsável | Data | OK |
|------|-------------|------|-----|
| Migrations | | | |
| Constraints/FK/índices | | | |
| Outbox lease + SKIP LOCKED | | | |
| Performance smoke | | | |

**Sem esta certificação assinada → proibido SHADOW com escrita real.**
