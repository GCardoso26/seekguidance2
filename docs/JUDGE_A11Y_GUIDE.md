# Judge TCG — Guia de acessibilidade (WCAG AA)

## Contraste

- Cada tema em `src/styles/tcg-theme.ts` define `--tcg-text-primary` sobre `--tcg-surface-elevated`.
- Ratios calculados em `THEME_CONTRAST_RATIOS` (mínimo **4.5:1** para texto normal).
- Testes CI: `tests/a11y/wcag-contrast.test.ts`

```bash
cd frontend/runtime_console_v3
npm run test -- tests/a11y
```

## Movimento reduzido

`prefers-reduced-motion: reduce` em `judge-table.css` desativa animações de mats, orb e flip.

## Teclado

- **Skip link:** “Saltar para o conteúdo” no topo da página Judge.
- **Focus visible:** outline `2px` com `--tcg-primary-light` em mats, cards e botões.
- **RuleSourceCard:** Enter/Espaço para virar a carta.

## Touch targets

Botões de feedback e ações rápidas: mínimo **48×48px** (`min-h-12 min-w-12`).

## Screen readers

- `PipelineOrb`: `role="status"`, `aria-live="polite"`.
- Toasts: `role="status"`.
- Ícones decorativos com `aria-hidden` onde aplicável.

## Chromatic (opcional)

Configurar token `CHROMATIC_PROJECT_TOKEN` e script `npm run chromatic` quando Storybook for adicionado ao projeto.
