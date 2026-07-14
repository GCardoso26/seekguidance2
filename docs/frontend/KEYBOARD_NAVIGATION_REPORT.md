# Keyboard Navigation Report — RC1.2

**Data:** 2026-07-14  
**Escopo:** rotas críticas (Store, cart, checkout, comprador, auth guest, decks)

## Validação

| Fluxo | Tab order | Focus visível | Trap | Nota |
|---|---|---|---|---|
| `/` header + search | OK | OK | — | `GlobalHeader` / Search |
| `/loja` grid + CTAs | OK | OK | — | RSC cards + links |
| `/loja/busca` filtros | OK | OK | — | panel + results |
| `/carrinho` / checkout | OK | OK | — | form controls |
| Dialogs (CartDrawer lazy) | OK quando aberto | OK | Radix focus trap | on-demand |
| `/entrar` (seller guest) | OK | OK | — | auth form |

## Achados

- Sem keyboard traps medidos nas rotas críticas em lab.
- Skip link / landmarks: páginas com shell MobileLayout / Luxury mantêm navegação por teclado.

## Residual

- Validação assistiva profunda de drawers raros (wishlist avançada) fica como dívida não-bloqueante — LH A11y =100 nas rotas críticas.
