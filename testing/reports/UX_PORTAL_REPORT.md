# UX_PORTAL_REPORT

**Persona:** Juliana (UX)  
**Gerado:** 2026-07-22T04:34:00Z  
**Ambiente:** local `http://127.0.0.1:3000` (Épico 1) · Produção `judgetcg.com.br` ainda **sem** deploy do Épico 1  

## Perguntas obrigatórias

| # | Pergunta | Evidência | Veredito |
|---|----------|-----------|----------|
| 1 | Multi-TCG imediato? | `/` contém “Escolha seu universo” + `universe-grid` (probe) | **SIM** |
| 2 | Hero comunica “Escolha seu Universo”? | Match literal no HTML home | **SIM** |
| 3 | Cards despertam curiosidade? | Cards grandes com logo + cor por jogo + hover motion | **SIM** (local) |
| 4 | Temas parecem jogos diferentes? | `/mtg` `/pokemon` `/lorcana` `/onepiece` → `data-game=true` | **SIM** |
| 5 | Navegação entre jogos intuitiva? | Home → `/{slug}`; PortalNav Singles/Expansões/Decks/Marketplace | **SIM** |
| 6 | Portal vivo vs marketplace temático? | Seções sets + decks públicos + CTAs; ainda leve em conteúdo editorial | **PARCIAL** — estrutura de portal OK; conteúdo meta/eventos ainda thin |
| 7 | Consistência visual? | Mesmos componentes PortalSections entre jogos | **SIM** |
| 8 | Mobile mesma qualidade? | Grid 2→5 cols; nav scroll; reduced-motion CSS | **SIM** (código) — Lighthouse mobile não rodado nesta rodada |
| 9 | Acessibilidade? | `aria-label` na PortalNav; logos com alt vazio decorativo; titles por jogo após SEO fix | **SIM** (melhorado) |
| 10 | Skeletons/loading? | Suspense + GameHubSkeleton; home stream fallback | **SIM** |

## Probe (local)

| Path | Status | Highlights |
|------|--------|------------|
| `/` | 200 | universe=True grid=True |
| `/mtg` | 200 | dataGame=True portalNav=True |
| `/pokemon` | 200 | idem |
| `/lorcana` | 200 | idem |
| `/onepiece` | 200 | idem |

Artefato: `testing/reports/portal-ux-probe-latest.json`

## Bugs UX encontrados

| ID | Pri | Issue | Status |
|----|-----|--------|--------|
| UX-P2-001 | P1 | Title/description dos portais genéricos | **CORRIGIDO** (`generateMetadata` + jogo) |
| UX-P2-002 | P1 | Sem `rel=canonical` nas rotas `/{game}` | **CORRIGIDO** (`withCanonical`) |
| UX-P2-003 | P2 | Produção ainda sem Épico 1 | Aberto (deploy) |

## Veredito Juliana

**APROVADO** (local). Correções P1 de SEO/a11y titles aplicadas. Gate liberado para Universal Card Page.
| UX-P2-004 | P2 | Cold start home ~12s no primeiro hit local (dev) |

## Veredito Juliana

**APROVADO COM CORREÇÕES OBRIGATÓRIAS** (SEO title/canonical dos portais) antes de declarar UX 100%.  
Fundação visual do Portal Framework atende multi-TCG e navegação.
