# PDV — Persona Marina (Lojista)

**Persona:** Marina Costa — Seller QA  
**Fonte primária:** `persona-marina-seller-latest.json` (2026-07-22T21:12:36Z)  
**Extras:** Playwright `seller-pdv.spec.ts`, Vitest PDV, probes prod

## Veredito Marina

**Operação de um dia inteiro (Painel + PDV): NÃO COMPROVADO**

Lifecycle automatizado passou (9/9), mas a própria evidência declara cobertura parcial e **não cobre PDV**.

## Login / sessão

| Item | Status | Evidência |
| --- | --- | --- |
| Login → dashboard | PASS (lifecycle) | `coveredFlows`: login→dashboard |
| Logout | **Não comprovado** | — |
| Recuperação de senha | **Não comprovado** | — |
| Expiração de sessão | **Não comprovado** | — |
| Refresh token | **Não comprovado** | — |
| Mensagens / loading / erros UX login | **Não comprovado** (além do happy path lifecycle) | — |

## Cadastro da Loja

Nome, logo, banner, descrição, endereço, CEP, telefone, WhatsApp, PIX, conta bancária, dados fiscais, redes, horário, políticas, frete, categorias:

**Não comprovado** nesta campanha.

`coverageNote` Marina: *Não cobre cadastro/KYC/PIX/avatar/banner/…*

## Painel do Lojista

| Área | Status |
| --- | --- |
| Dashboard (acesso pós-login) | PASS parcial (lifecycle) |
| Produtos (CRUD parcial) | PASS lifecycle cadastrar/editar/excluir |
| Estoque (atualizar) | PASS lifecycle |
| Cupons (criar) | PASS lifecycle |
| Pedidos (status) | PASS lifecycle |
| Relatórios (gerar) | PASS lifecycle |
| PDV | **FAIL / incompleto** — ver abaixo |
| Financeiro / Analytics / Equipe / Permissões / Integrações / Favoritos / Wishlist / Marketplace publicação multi-estado | **Não comprovado** |

Tempo de carregamento / consistência visual de todas as áreas: **Não comprovado** (Juliana partial).

## Cadastro de produtos

| Tipo | Status |
| --- | --- |
| Produto genérico lifecycle | PASS |
| Cartas / Selados / Acessórios / Bundles / Combos / Personalizados (matriz completa) | **Não comprovado** |
| SKU, EAN, condição, idioma, foil, raridade, expansão, fabricante, peso, dimensões, preço promo | **Não comprovado** (matriz completa) |

## Asset Pipeline

Upload, compressão, WebP/AVIF/JPEG, thumb, zoom, galeria, hero, banner, fallback, alt, lazy, skeleton, blur, LQIP:

**Não comprovado.**

## Estoque

| Operação | Status |
| --- | --- |
| Atualizar estoque (lifecycle) | PASS |
| Entrada / saída / ajuste / inventário / última unidade / negativo / reservado / confirmado / liberado | **Não comprovado** |

## Marketplace (lojista)

Publicar / pausar / reativar / excluir / duplicar / promoções / frete loja:

**Não comprovado** (Fernanda também pending_manual).

## PDV

| Passo | Status | Evidência |
| --- | --- | --- |
| Acessar `/vendedor/painel/pdv` | PASS (2 testes Playwright) | heading PDV / URL |
| UI balcão carrega (barcode, busca, carrinho) | PASS (snapshot error-context) | error-context.md do fail dinheiro |
| Abrir caixa / sangria / suprimento | **Não comprovado** | — |
| Adicionar cliente | **Não comprovado** | — |
| Buscar + adicionar produto + qty + desconto + cupom | **Não comprovado** (E2E abortou) | Playwright fail |
| PIX / cartão / dinheiro / misto | **Não comprovado** (E2E) | 3 fails |
| Comprovante / fechar venda / estoque / financeiro / pedido / histórico | **Não comprovado** | — |
| Cancelamento / estorno / reabertura / troco / parcial / timeout / PIX expirado | **Não comprovado** | — |
| Componentes unitários PDV | PASS 10/10 Vitest | `_pdv_vitest_20260722_181006.json` |

### Bug observado (P1)

`PDV-BUG-001`: página PDV renderiza (“Balcão — QA Store …”, carrinho, total R$ 0,00), mas `skipIfPdvUnavailable` exige `data-testid=pdv-manager` **ou** upsell; sem o testid, o teste falha e **não executa** busca/finalizar.

## Financeiro / Analytics / Relatórios

| Item | Status |
| --- | --- |
| Relatório (gerar — lifecycle 08) | PASS parcial |
| Receitas/despesas/saldo/PIX/comissões/taxas/gráficos/exportação completa | **Não comprovado** |
| Analytics (ticket, lucro, curvas, filtros) | **Não comprovado** |
| PDF / Excel / CSV | **Não comprovado** (formato específico) |

## Produção — pagamentos (contexto Marina)

Sessão anterior (não repetida E2E nesta rodada PDV): `POST .../checkout` 400 e `POST .../connect/refresh/{storeId}` 500 na loja de testes. Mitigação API (`d173feb1`); revalidação completa pós-deploy FE: **Não comprovado**.

## Melhorias sugeridas (Marina)

1. Adicionar `data-testid="pdv-manager"` (e demais hooks) para destravar E2E do balcão.
2. Incluir PDV no lifecycle Marina (venda dinheiro mínima + assert estoque).
3. Checklist automatizado de cadastro de loja (PIX + Stripe) separado do lifecycle de produtos.
4. Evidência de refresh token / logout / recuperação de senha no gate de seller.

## Conclusão Marina

Lifecycle de produtos/pedidos/relatório **funciona em ambiente de teste**. Dia operacional real com PDV + financeiro + cadastro completo de loja: **Não comprovado**.
