# Card Table Interface — Design System Judge TCG v2

## Implementado (Fase 1–3 parcial)

| Item | Caminho |
|------|---------|
| Temas CSS por TCG | `frontend/runtime_console_v3/src/styles/tcg-theme.ts` |
| ThemeProvider | `src/providers/tcg-theme-provider.tsx` |
| Estilos mesa | `src/styles/judge-table.css` |
| Layout 3 zonas | `src/components/judge/GameTableLayout.tsx` |
| GameMatSelector | `src/components/judge/GameMatSelector.tsx` |
| VerdictCard | alias de `ResponseCard` |
| PipelineOrb | `src/components/judge/PipelineOrb.tsx` |
| RuleSourceCard / painel | `RuleSourceCard.tsx`, `RuleSourcesPanel.tsx` |
| MatchLog | `MatchLog.tsx` |

## Variáveis de ambiente

Nenhuma — temas são estáticos no cliente.

## Responsivo

- **Desktop (md+):** histórico | mesa | fontes
- **Mobile:** abas Histórico · Mesa · Fontes

## Fase 4 (implementada)

- WCAG: `lib/wcag-contrast.ts`, `THEME_CONTRAST_RATIOS`, testes `tests/a11y/`
- Confetti 👍 (`canvas-confetti`) + haptic (`utils/haptic.ts`)
- Toasts (`lib/toast.ts`, `JudgeToast`)
- `EmptyTableState`, `ErrorCardState`
- `RuleSourceCard` flip 3D (framer-motion)
- `MatchLog` + deep link `?round=UUID` (`lib/match-log.ts`)
- `PipelineOrb` overlay com fases HyDE/rerank
- Badge cache hit, warmup no header, link métricas

Ver [JUDGE_A11Y_GUIDE.md](./JUDGE_A11Y_GUIDE.md).

## Critérios de aceitação

- [x] Cores aplicam ao selecionar TCG (`data-tcg` + CSS vars)
- [x] Layout responsivo 3 zonas / abas mobile
- [x] `prefers-reduced-motion` global na mesa
- [x] Touch targets ≥ 48px em feedback e fontes
- [x] Contraste WCAG AA validado em CI por tema
- [x] Skip link + focus visible
- [ ] Chromatic baseline (requer Storybook)
- [ ] Lighthouse A11y ≥ 95 em produção
