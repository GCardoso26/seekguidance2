# PIX Report — Stabilization

**Bug relacionado:** PDV-BUG-003 (contexto multi-loja / “PIX não salva”)  
**Data:** 2026-07-22

## Causa do falso negativo (documentada)

Formulário PIX lia/gravava `storeId` diferente da loja que o lojista via no painel (owner com 2+ lojas).

## Correções relevantes

- `useSellerStore`: prioriza loja do dashboard.
- `PixConfigForm`: sync de `pix_key` / `pix_key_type` via `useEffect` + PUT `payment-settings`.
- Backend: ordem de lojas alinhada Connect ↔ dashboard ↔ `/stores/mine`.

## Evidências desta sprint

| Item | Status |
| --- | --- |
| Código alinhado multi-loja | PASS (diff) |
| Vitest `pdv-pix-payment` | PASS (4 tests) |
| Playwright PDV tab PIX | PASS (spec verde; QR depende de produto/seed) |
| Persistência PIX autenticada em prod | **NÃO COMPROVADO** |
| Checkout PIX comprador (Carlos PSP real) | **NÃO COMPROVADO** |

## Conclusão

Mitigações de contexto multi-loja estão no código. Persistência e checkout PIX **ao vivo** ainda precisam de prova autenticada.
