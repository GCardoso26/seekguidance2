# Screen Reader Report — RC1.2

**Data:** 2026-07-14  
**Método:** árvore de acessibilidade do Lighthouse + inspeção de nomes acessíveis nas falhas pré-fix

## Checklist

| Requisito | Status | Evidência |
|---|---|---|
| Nomes acessíveis em controles interativos | PASS | A11y 100 / audits weighted |
| Hierarquia de headings | PASS | sem `heading-order` weighted fail pós-fix |
| Landmarks | PASS | shell layout + main nas rotas lab |
| Live regions / loading | PASS parcial | estados de loading catálogo usam texto; degraded empty sem crash |
| Diálogos | PASS | Radix (CartDrawer / Upgrade fora do Store hub) |
| Imagens com alt | PASS | logos WebP + `alt` nos cards |

## Melhorias desta sprint

- Contraste de rating (warning) restaurado → leitores + visão permanece consistente semanticamente.
- Soft-degrade de APIs de catálogo evita páginas “quebradas” sem anúncio útil de erro de rede (empty sets/search).

## Residual

- Anúncios `aria-live` para flush de analytics não se aplicam (telemetry silencioso por design).
