# UX REGRESSION REPORT — V6.4

## Resumo

Regressões de UX confirmadas em produção (`judgetcg.com.br`) na busca/portais: logos 400, contraste de CTAs em primaries claras, filtros sem cor de texto explícita, e navegação de acessórios caindo na home da loja.

## Impacto por superfície

| Superfície | Sintoma | Fix |
|------------|---------|-----|
| Portal games (hero CTA) | Texto branco em botão amarelo/ciano | `--game-cta-fg` |
| Portal body (chips/labels) | `text-foreground` global vs `--game-bg` | Sync tokens no `PortalLayout` |
| Marketplace filtros | Checkbox/select ilegíveis | `text-foreground` |
| Hub categorias | Clique → `/loja` sem filtro | `/marketplace/produtos` |
| Logos next/image | Broken image icons | qualities 60/78 |

## Critério WCAG AA

Texto normal ≥ 4.5:1 — validado por unit/E2E theme helpers para todos os `GameId`.
