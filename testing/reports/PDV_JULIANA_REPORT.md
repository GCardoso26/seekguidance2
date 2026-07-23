# PDV — Persona Juliana (UX)

**Persona:** Juliana Almeida — UI/UX Auditor  
**Fonte:** `persona-juliana-ux-latest.json` (2026-07-22T21:13:45Z)  
**Extras:** snapshots Playwright PDV (error-context)

## Scores

- **status:** partial  
- **uxScore:** 6.5 / 10  
- **confidence campaign-011:** 62%  
- Nota orquestrador: automação parcial — campanha visual exige browser supervisionado

## Perguntas do brief

| Pergunta | Resposta com evidência |
| --- | --- |
| O painel parece profissional? | **Não comprovado** (sem auditoria visual supervisionada completa) |
| O PDV parece pronto para uso comercial? | **Não comprovado**. Evidência parcial: UI PDV carrega com heading, busca, carrinho e CTA “Finalizar venda” (snapshot Playwright). Fluxo de venda não validado. |
| Existe excesso de informações? | **Não comprovado** |
| Os menus são intuitivos? | **Não comprovado** |
| Os fluxos são rápidos? | **Não comprovado** (perceivedPerformance: []) |
| O mobile funciona? | **Não comprovado** — teste mobile PDV **falhou** (Playwright) antes de asserts de scan/carrinho por `pdv-manager` |
| O usuário sabe onde clicar? | **Não comprovado** |
| As mensagens são claras? | **Não comprovado** (além de copy vista no snapshot: “Vendas no balcão…”) |
| Há consistência visual? | **Não comprovado** |
| Quais telas precisam de redesign? | **Não comprovado** (lista formal); prioridade técnica: telas PDV + onboarding Stripe/PIX (contexto produção) |

## Bugs UX registrados pela persona

Nenhum em `visualBugs` nesta execução automatizada.

## Melhorias sugeridas (Juliana)

1. Sessão supervisionada (checklist Juliana) no painel + PDV mobile/desktop com screenshots obrigatórios.
2. Reduzir ambiguidades de empty state do PDV (“Nenhum produto…”) vs loading.
3. Garantir testids sem alterar UX visual (só instrumentação) para QA estável.
4. Revisar fluxo Connect/PIX no painel após deploy FE (consistência de loja ativa).

## Conclusão

UX profissional “pronta para comércio” **não comprovada**. Score parcial 6.5 não substitui walkthrough supervisionado.
