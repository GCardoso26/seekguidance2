# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dois públicos com **peso equivalente**, em balanças econômicas diferentes:

1. **Comprador / colecionador** — busca produtos (singles, selados, ingressos) no marketplace unificado, **independente do TCG**. Valor alto no **plano de cliente**.
2. **Vendedor / loja** — lista e opera inventário, pedidos e eventos. Valor alto no **plano de loja**. Seller = **hobby store verificada (CNPJ)** via credenciamento — não pessoa física com CPF nem plano free ([ADR-018](docs/architecture/adr/ADR-018-hobby-store-cnpj-accreditation.md)).

Ambos precisam da mesma plataforma; nenhum é “secundário” no produto — só o plano comercial muda o centro de gravidade. Caminhos de entrada são separados: **Comprar** vs **Vender** (`/vender`).

## Product Purpose

O JudgeTCG unifica catálogo e experiência de compra/venda de TCGs numa superfície canônica (vitrine, coleção, checkout, painéis), para que oferta e demanda se encontrem com menos fricção do que em marketplaces genéricos ou single-game.

**Sucesso (produto):** liquidez mensurável (North Star R1: LPC e correlatos) — não faturamento como proxy de aprendizado no beta. Beachhead comercial R1 = Lorcana; a arquitetura e o usuário-alvo de catálogo **não** se limitam a um único jogo.

## Positioning

**Unificação de catálogo com experiência excepcional** para vendedor e comprador no mesmo sistema — claim que vizinhos (TCGPlayer, Liga, Cardmarket) não podem copiar com honestidade se entregarem só listagem genérica ou só um TCG sem a mesma experiência unificada.

## Operating Context

- Superfície canônica: `frontend/runtime_console_v3` + `services/api` + Postgres.
- Fluxos: vitrine `/loja`, hubs por jogo, coleção, carrinho/checkout, pedidos, painel `/vendedor`, judge, admin.
- Hierarquia de verdade: Platform Constitution → ADRs → North Star → especificação funcional → código.
- Design visual vigente: direção **Galeria** (`DESIGN.md`); motion via allowlist React Bits.
- Beta: liquidez (LPC/LCS); sem seeds/simulation em Beta (Constituição).

## Capabilities and Constraints

**Confirmado**

- Marketplace multi-TCG com catálogo unificado e providers por jogo.
- Papéis comprador e seller com planos distintos (cliente vs loja).
- Coleção, busca, checkout (PIX/Stripe/balcão onde aplicável), painéis operacionais, judge de regras.
- Expansão de TCGs via allowlist/ADRs — não feature flags soltas por jogo fora de `GameConfiguration` / providers.

**Constraints**

- Métricas de engenharia (health, readiness) **não** substituem North Star de produto.
- `/carrinho`, `/checkout`, pedidos e listagens seller permanecem em Galeria clara (sem “Noite de Leilão”).
- Copy e canônicas de URL em pt-BR.

**Em aberto (não inventar)**

- Detalhe de SKUs/preços dos planos cliente vs loja.
- Roadmap de leilão ao vivo (só reservado na allowlist de motion).

## Brand Commitments

- Nome: **JudgeTCG**.
- Tom de produto: experiência excepcional de catálogo unificado (não “loja genérica de TCG”).
- Direção visual documentada em `DESIGN.md` (Galeria) — init **não** redefine o mundo visual.

## Evidence on Hand

- `docs/architecture/PLATFORM_CONSTITUTION.md`
- `docs/product/NORTH_STAR_RELEASE_1.md` (LPC / liquidez)
- `docs/product/PLATFORM_FUNCTIONAL_SPECIFICATION.md`
- `DESIGN.md` (Galeria)
- `docs/frontend/REACT_BITS_GALLERY_ALLOWLIST.md`
- Código canônico em `frontend/runtime_console_v3` e `services/api`

**Ausências a não fabricar:** depoimentos, benchmarks de conversão, números de GMV, logos de parceiros não versionados como prova.

## Product Principles

1. **Dois lados, mesmo produto** — comprador e seller têm valor igual; planos diferentes, experiência coerente.
2. **Catálogo unificado primeiro** — a diferenciação é a unificação + experiência, não um skin por TCG.
3. **Liquidez antes de vaidade** — aprendizado de mercado (LPC) manda no beta; não feature-creep para “parecer vivo”.
4. **Acessibilidade como requisito** — não polish opcional.
5. **Constituição vence código** — ADRs e North Star limitam o que entra.

## Accessibility & Inclusion

Acessibilidade é **obrigatória**, além de leitores de tela: incluir necessidades de pessoas com **deficiência visual e/ou auditiva** (ex.: contraste e foco; alternativas textuais; não depender só de cor ou só de áudio para informação crítica). Padrão alvo alinhado a WCAG 2.x AA como piso, com expansão conforme evidência de uso — detalhes de implementação ficam em trabalho de design/engenharia, não inventados aqui.
