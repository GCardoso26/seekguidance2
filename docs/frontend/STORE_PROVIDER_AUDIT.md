# Store Provider Audit — RC1.1

## Antes

`MarketplaceProviders` em `/loja`:
- UpgradeModalProvider (sync)
- CartProvider → CartDrawer (sync)
- SearchPlatformProvider
- PWAInstallPrompt (dynamic)

## Depois

`StoreProviders` em `/loja`:
- SearchPlatformProvider (header search / Ctrl+K)
- CartDrawer **dynamic ssr:false**
- PWAInstallPrompt dynamic

**Não inicializa:** SellerProviders, JudgeProviders, UpgradeModal, Inventory, Buyer AI, Seller AI.

## Contagem

| | Antes | Depois |
|---|---:|---:|
| Providers no layout Store | 3 sync (+1 dynamic PWA) | 1 sync Search (+2 dynamic) |
| Providers removidos do hub | — | UpgradeModal (+ Cart sync) |

Cart CTA no header permanece funcional (Zustand + drawer lazy).
