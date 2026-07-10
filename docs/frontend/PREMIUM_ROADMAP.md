# Premium Roadmap — pós-beta até 9.5+

## Sprint P1 (2–3 dias) — fechar aceite 9.5

1. Rodar `npm run ds:audit` e zerar hotspots P0 (text-white, luxury-gold, border-white)
2. Script migrate `text-xs` → `text-caption` / `text-small` nos top 50 arquivos
3. Judge portal: substituir `text-white/*` por tokens
4. Finance: DataTable canônico + chart strokes via CSS vars
5. Ativar `ds:audit` no quality-gates com threshold

**Exit:** Scorecard ≥ 9.5 · ds-audit hits críticos < 50

## Sprint P2 (1 semana) — delight + mobile

1. Card rows mobile para Orders/Listings
2. Quick preview hover (marketplace) — UI only
3. Animated counters em KPIs (Framer, reduced-motion safe)
4. Densidade PanelShell configurável
5. WCAG AA pass em fluxos buyer (axe CI)

## Sprint P3 — rebrand dry-run

1. Trocar env `NEXT_PUBLIC_BRAND_*` em staging
2. Validar OG / PWA / favicon / emails templates
3. Remover API Tailwind `luxury.*` (breaking visual controlado)

## Fora de escopo (inalterável)

- APIs, BCs, migrations, CQRS, Event Driven, Domain Model
- Novas feature flags de produto
- Features de negócio

## Referências

- `PREMIUM_AUDIT.md`
- `PREMIUM_SCORECARD.md`
- `context/11- release/release-checklist.md`
- `docs/sprint16/STAGING_ROLLOUT.md`
