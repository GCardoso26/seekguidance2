# BUG BACKLOG — Platform V6.4

## P0 — Functional regressions

| ID | Severity | Status | Summary |
|----|----------|--------|---------|
| V6.4-003 | P0 | FIXED (pending deploy) | `/_next/image?...&q=60\|78` → 400; logos quebrados em busca/portais |
| V6.4-004 | P0 | FIXED | Chips Sleeves/Deck Boxes/… → `/marketplace` → redirect `/loja` |
| V6.4-001 | P0 | FIXED | CTA/portais com contraste &lt; 4.5 (ex.: Pokémon primary amarelo + texto branco) |
| V6.4-002 | P1 | FIXED | Labels/inputs de filtro sem `text-foreground` |
| V6.4-005 | P1 | PARTIAL | Acessórios vazios: inventário + filtro `game_id`; singles OK |
| V6.4-006 | P1 | OPEN | Certificação E2E pós-deploy |

## P2 — Console noise (não abre gate sozinho)

| ID | Summary |
|----|---------|
| V6.4-N01 | Cloudflare Insights SRI integrity mismatch |
| V6.4-N02 | Vitals beacon POST fail |
| V6.4-N03 | Tournament events 401 (soft-fail já em `softJson`) |

## Closure criteria

- [ ] Deploy frontend com `images.qualities` atualizado
- [ ] E2E V6.4 PASS em prod ou staging espelhado
- [ ] Logos `_next/image` q=60/78 → 200
- [ ] Clique em Sleeves → URL contém `/marketplace/produtos` + `category=`
- [ ] READY_FOR_PRODUCTION = TRUE somente com evidências acima
