# PDV — UX Improvements (consolidadas por persona)

Somente melhorias ancoradas em lacunas ou evidências desta campanha. Sem mudança de arquitetura/domínio (ADR-015).

## UX / Layout / Mobile (Juliana + Marina)

1. Walkthrough supervisionado do painel e PDV (desktop + 375px) com screenshots obrigatórios — hoje Juliana está `partial` / score 6.5.
2. Empty states do PDV: distinguir “digite 2 caracteres”, “sem resultados” e “carregando”.
3. Completar teste mobile PDV após corrigir `PDV-BUG-001` (scan + carrinho).

## Fluxos / PDV (Marina)

1. Instrumentação de testids (`pdv-manager`, barcode, cart, add-product) para E2E estável.
2. Incluir no lifecycle: venda dinheiro mínima → assert estoque → entrada no histórico.
3. Cobrir caixa (abrir/fechar), sangria/suprimento e pagamento misto em campanha dedicada.
4. Checklist de cadastro de loja (PIX, Stripe, endereço, horários) fora do lifecycle de produto.

## Busca / Filtros (Eduardo)

1. Smoke painel: pedidos, clientes, SKU.
2. Autocomplete e facets no browser (hoje só nota).

## Catálogo / Coleção (Daniela)

1. Importação + matriz sealed/acessórios (FCS Sealed 15%).
2. Smoke Asset Pipeline (thumb/WebP/fallback) com evidência visual.

## Marketplace (Fernanda)

1. Comparativo mínimo 3 lojas (preço / disponibilidade) com evidência.
2. Notas de liquidez no MRB preenchidas (hoje `marketplaceNotes: []`).

## Performance (Renato)

1. Corrigir workload PDP 404.
2. Medir CWV/memória nas rotas autenticadas Dashboard, Produtos, Pedidos, PDV, Relatórios.

## Relatórios / Analytics (Marina)

1. Export PDF/Excel/CSV com assert de arquivo gerado.
2. Smoke analytics: ticket médio, top produtos, filtro de período.

## Atalhos

1. Atalhos de teclado no PDV (foco barcode, finalizar) — **Não comprovado** se existem; validar na próxima rodada E2E.

## Prioridade sugerida (sem implementar nesta campanha)

| Prioridade | Item |
| --- | --- |
| P1 QA | `PDV-BUG-001` testids / helper |
| P1 Prod | Revalidar Stripe/PIX pós-deploy FE |
| P2 | PDP Renato 404 |
| P2 | Lifecycle PDV + estoque |
| P3 | Walkthrough Juliana completo |
