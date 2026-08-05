# CUSTOMER VALIDATION COUNCIL (CVC)
## JudgeTCG Marketplace — Version 1.0

**Data:** 2026-07-23  
**Ambiente:** https://judgetcg.com.br  
**Método:** 8 personas isoladas · jornada completa · consolidação por moderador UX  

> **Update 2026-07-24 — CUSTOMER CONVERSION FIRST**  
> Reavaliação Antes×Depois: [`CUSTOMER_CONVERSION_FIRST_BEFORE_AFTER.md`](./CUSTOMER_CONVERSION_FIRST_BEFORE_AFTER.md).  
> Bug crítico de busca (`/search` = torneios) corrigido; home/nav conversion-first.  
> Liquidez real continua o bloqueio de “Compraria hoje”.

---

# VEREDITO FINAL

# NOT READY FOR CUSTOMERS

### Motivos (exatos)

1. **Busca não encontra o que o cliente quer** (Lightning Bolt = 0, Charizard = 0, ETB = 0, playmat = 0, deck box = 0).  
2. **Vitrine pública parece laboratório** (“Loja de Testes”, “Loja Teste Debug”, “Sleeve teste”, “ONEPIECE Carta #1”).  
3. **Produtos sem foto crível** (boosters vazios; sleeve com link da Amazon no lugar da imagem).  
4. **Acessórios praticamente inexistentes** (1 sleeve lixo; 0 playmat/deck box).  
5. **Zero de 8 personas gastaria R$50 / R$300 / R$1000** aqui hoje.  
6. **Jornada morre antes do carrinho** — checkout nem é testável com compra desejada.  
7. **Identidade confusa** (Planos + juízes + loja) reduz confiança do comprador comum.

**Ninguém comprou. Ninguém indicaria. NPS estimado: −72.**

---

## Artefatos

| Arquivo | Conteúdo |
|---------|----------|
| [consumer-reports/magic.md](./consumer-reports/magic.md) | Magic competitivo |
| [consumer-reports/pokemon.md](./consumer-reports/pokemon.md) | Colecionador Pokémon |
| [consumer-reports/lorcana.md](./consumer-reports/lorcana.md) | Jogador Lorcana |
| [consumer-reports/commander.md](./consumer-reports/commander.md) | Commander casual |
| [consumer-reports/parent.md](./consumer-reports/parent.md) | Pai presente |
| [consumer-reports/deals.md](./consumer-reports/deals.md) | Caçador de promo |
| [consumer-reports/amazon.md](./consumer-reports/amazon.md) | Cliente Amazon/ML |
| [consumer-reports/seller.md](./consumer-reports/seller.md) | Lojista |
| [consumer-reports/consensus.md](./consumer-reports/consensus.md) | Consolidação |
| [consumer-reports/heatmap.md](./consumer-reports/heatmap.md) | Abandono por tela |
| [consumer-reports/shopping-journey.md](./consumer-reports/shopping-journey.md) | Jornada |
| [consumer-reports/customer-score.json](./consumer-reports/customer-score.json) | Scores |
| [consumer-reports/customer-backlog.json](./consumer-reports/customer-backlog.json) | Backlog |
| [consumer-reports/customer-roadmap.md](./consumer-reports/customer-roadmap.md) | Roadmap |

---

## Evidências concretas da vitrine (2026-07-23)

| Busca / fatia | Resultado |
|---------------|-----------|
| Lightning Bolt | 0 |
| Charizard | 0 |
| Elite Trainer | 0 |
| Playmat | 0 |
| Deck box | 0 |
| Sleeve (texto) | 1 — “Sleeve teste”, loja debug, “imagem” = busca Amazon |
| Categoria booster | 5 — sem fotos, “Loja de Testes 1”, R$99,90 |
| Categoria single | 13.570 — inclui “ONEPIECE Carta #1” seed sem foto |
| Categoria sleeve | 1 |

---

## Problemas priorizados

### P0 — Impedem venda

| Título | Descrição | Como o usuário percebeu | Como afeta a compra | Personas | Correção |
|--------|-----------|-------------------------|---------------------|----------|----------|
| Busca vazia nos staples | Bolt/Charizard/ETB/playmat/deckbox = 0 | “Não tem o que eu quero” / “catálogo mentiroso” | Abandono imediato | 8 | Indexar/anunciar o que vende; busca por nome popular |
| Vitrine de teste | Lojas e SKUs de teste no ar | “Loja de Testes”, “Sleeve teste” | Zero confiança | 8 | Bloquear teste em produção |
| Sem foto | Boosters/singles sem imagem; sleeve com URL Amazon | “Não vejo o produto” | Não adiciona ao carrinho | 8 | Foto obrigatória |
| PDP fraca | Página genérica / sem prova visual | “Não parece produto de verdade” | Não fecha | 7 | PDP completa |
| Acessórios vazios | 1 sleeve lixo | “Cadê sleeve/playmat?” | Commander/Lorcana saem | 5 | Estoque real ou esconder |

### P1 — Reduzem conversão

| Título | Descrição | Personas | Correção |
|--------|-----------|----------|----------|
| Sem filtros NM/foil/edição | Competitivo não compra | 2+ | Filtros de condição |
| Sem comparador multi-loja | Promessa da home não se cumpre | 3+ | Ofertas lado a lado |
| Menu Planos na loja | Parece SaaS | 7 | Separar comprador/lojista |
| Home sem oferta clara | “Carregando…” + universos | 8 | Grid de ofertas |
| Sem avaliação/frete | Padrão Amazon ausente | 6 | Trust signals |
| Preço absurdo | R$15.000 sem foto; booster R$99,90 suspeito | 4 | Moderação |

### P2 — Experiência

Rodapé (Termos `#`, Contacto, Documentação→home); jogos Em breve; carrinho pouco visível.

### P3 — Melhorias

Cupons, kits presente, frete grátis, histórico de preço.

---

## Scores finais

| Métrica | Valor |
|---------|------:|
| Customer Satisfaction | 2.1 / 10 |
| Conversão estimada | 0% |
| Customer Trust Score | 1.4 / 10 |
| Marketplace Score | 1.5 / 10 |
| Search Score | 0.6 / 10 |
| PDP Score | 2.0 / 10 |
| Checkout Score | 1.5 / 10 |
| Visual Score | 5.6 / 10 |
| Accessibility Perception | 4.0 / 10 |
| Navigation Score | 2.8 / 10 |
| Purchase Friction | 9.2 / 10 |
| Abandonment Risk | 9.5 / 10 |
| NPS estimado | −72 |

---

## Índice de conversão (personas)

| Comprariam agora | Desistiriam | Etapa dominante |
|-----------------:|------------:|-----------------|
| 0 / 8 | 8 / 8 | Busca → Marketplace |

## Confiança de gasto

| R$50 | R$300 | R$1000 |
|-----:|------:|-------:|
| 0/8 | 0/8 | 0/8 |

---

## Resposta à única pergunta

### Eu compraria aqui?

**Não.** O site é bonito demais para o que entrega na prateleira. Parece loja. Age como ambiente de teste. Enquanto Charizard e Lightning Bolt não aparecem, e “Loja de Testes” aparece, **não está pronto para cliente real**.
