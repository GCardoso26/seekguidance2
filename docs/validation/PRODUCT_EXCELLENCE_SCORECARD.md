# PRODUCT_EXCELLENCE_SCORECARD — Business Program 5 (sprint 1)

**Gate:** tela/fluxo só permanece se ≥ 9.8 em todas as dimensões após refactor.  
**Sprint 1 status:** remediação P0 de atrito iniciada — **programa NÃO encerrado**.

## Mudanças entregues (não features novas)

| Área | Ação |
|------|------|
| Auth | `entrarPath` · `/entrar` aceita `next`+`redirect` · CTAs `/login`→`/entrar` |
| Confiança | `/termos` · TrustFooter · brand legal/CNPJ env · footer Termos≠Privacidade |
| Compra | 1 CTA Comprar · vai ao carrinho · condições em PT · frete copy CEP |
| Linguagem | Glossary · hero sem overclaim · Conta/Baralhos · Compra protegida já PT |
| Seller | Publicar e cadastrar outra (sem redirect) |
| Juiz ops | JSON shell → deep link `/tournament/[id]` |
| Torneio | pending guards · double-report guard |
| A11y/perf | type scale ↑ · muted mais escuro · blur removido do bottom nav |
| Landing | teasers juiz/torneio/comunidade ocultados no funil loja |
| Sec | `create_event` hard 403 |

## Notas (após sprint 1 — honestidade)

| Fluxo | Visual | UX | Conv. | Mkt | Trust | A11y | Vel. | Legib. | Prod. | Delight | Final | ≥9.8? |
|-------|-------:|---:|------:|----:|------:|-----:|-----:|-------:|------:|--------:|------:|:-----:|
| Auth → retorno | 8.5 | 9.2 | 9.3 | 8.8 | 8.5 | 9.0 | 9.0 | 9.0 | 9.2 | 8.0 | **8.9** | Não |
| PDP Comprar | 8.8 | 9.4 | 9.5 | 9.0 | 8.7 | 9.1 | 8.8 | 9.3 | 9.3 | 8.5 | **9.0** | Não |
| Hero loja | 8.5 | 9.0 | 9.0 | 8.5 | 8.8 | 9.0 | 8.5 | 9.2 | 9.0 | 8.0 | **8.8** | Não |
| Cadastro anúncio | 8.0 | 9.2 | 9.3 | 8.5 | 8.0 | 8.8 | 9.0 | 8.8 | 9.2 | 8.0 | **8.8** | Não |
| Torneio ops | 7.5 | 8.0 | — | — | 7.0 | 8.0 | 8.0 | 8.5 | 8.0 | 6.5 | **7.7** | Não |
| Legal/trust | 8.0 | 9.0 | 8.5 | 8.0 | 9.2 | 9.0 | 9.5 | 9.0 | 9.0 | 7.5 | **8.8** | Não |

Nenhuma tela atinge **9.8** ainda — correto. Sprint 1 remove atrito crítico; excelência absoluta exige ciclos seguintes (cart global, CEP na PDP, CNPJ real, floor judge 1-click, fin RBAC, Lighthouse, DS visual proprietário).

## Backlog restante (anti-4.5 remanescente)

1. CartProvider + drawer global (BUY-004)  
2. Cart 401 explícito na UI do badge (BUY-003)  
3. Financial mutator RBAC (SEC-001)  
4. Analytics emit persist (ANA-01) + SEA-02  
5. CEP estimado na PDP  
6. Visual brand fora do índigo template  
7. Floor judge mesa-board &lt; EventLink clicks  
8. E2E: guest compra &lt;60s  

## Gates PR

Checklist em `context/business-program-5.md`.
