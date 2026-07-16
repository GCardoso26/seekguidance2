# BUG_REGISTRY.md — Business Program 4.5 Product Validation

**Date:** 2026-07-15  
**Method:** Code-path audit (buyer/seller/tournament/financial/sandbox/analytics/search/security). No production code changes in this sprint.  
**Scope note:** “Hundreds of journeys” simulated via systematic persona × flow coverage against current `main` (post BP1–3.5); not live browser farms.

Legend: **P0** blocks trust/conversion/security · **P1** high impact · **P2** material UX/debt · **P3** polish.

| ID | Cat | Area | Page/Flow | Sev | Impact | Prob | Pri | Repro (summary) | Hypothesis | Suggestion | Est | Owner |
|----|-----|------|-----------|-----|--------|------|-----|-----------------|------------|------------|-----|-------|
| BUY-001 | Auth | Buyer | Marketplace CTAs → `/login` | P0 | Funil Auth quebrado (console admin) | Alta | P0 | Guest → Anunciar / add browse marketplace | CTAs legados apontam `/login` | Unificar `/entrar?next=` | S | Frontend |
| BUY-002 | Auth | Buyer | Header Vender / torneio `?redirect=` | P0 | Pós-login perde destino | Alta | P0 | Guest → Vender → login → `/perfil` | `/entrar` só lê `next` | Aceitar `redirect` **ou** padronizar `next` | S | Frontend |
| BUY-003 | Cart | Buyer | GET cart 401 | P1 | Carrinho “vazio” silencioso | Alta | P0 | Sessão expirada + badge cart | Proxy mascara 401 como empty | Propagar 401 + CTA login | M | Frontend+API |
| BUY-004 | Cart | Buyer | Header cart fora `/loja` | P1 | Drawer não abre em `/mtg/cards` | Alta | P1 | Em game cards → click cart | `CartDrawer` só em StoreProviders | CartProvider no shell global | M | Frontend |
| BUY-005 | Catalog | Buyer | Listing sem `store_product_id` | P1 | Preço comprável falso | Média | P1 | Carta com listing órfão | Fallback listings + CTA lowestPrice | Só CTA com productId | M | Marketplace |
| BUY-006 | Auth | Buyer | Email confirm UX | P1 | Drop pós-signup | Alta | P1 | SignUp + confirm on | `setError` vermelho; `next` não persiste | Estado sucesso + persist next | S | Frontend |
| BUY-007 | Nav | Buyer | Header BP3.5 | P2 | Menos CTAs commerce desktop | Alta | P2 | Desktop sem Comprar/Comprador | Comprar removido de propósito | Link Comprador no UserMenu | S | Frontend |
| BUY-008 | Wallet | Buyer | `/comprador/financeiro` | P2 | Carteira zerada / shell | Alta | P2 | Abrir página sem BFF auth cookies | RSC fetch sem credentials | Client authenticated fetch | M | Frontend |
| BUY-009 | Auth | Buyer | Marketplace browse | P2 | Hop extra + /login | Média | P2 | Browse add requires auth | Legado marketplace | `/entrar` + `/carrinho` | S | Frontend |
| BUY-010 | Search | Buyer | Header search fail | P2 | Silêncio = “sem resultados” | Média | P2 | API search down | Só seta se `res.ok` | Estado error + retry | S | Frontend |
| BUY-011 | Auth | Buyer | Header Entrar | P2 | Perde pathname | Alta | P2 | Guest em /decks → Entrar | `href=/entrar` sem next | `next=pathname` | S | Frontend |
| BUY-012 | Checkout | Buyer | Soft cart 401 | P2 | Empty vs unauth confuso | Média | P2 | Token ruim no checkout | Depende BUY-003 | Distinguir estados | M | Frontend |
| BUY-013 | Cart | Buyer | Smart Cart goals | P2 | Atrito pré-checkout | Média | P3 | /carrinho com goals abertos | UX power-user first | Collapse default | S | Frontend |
| BUY-014 | Auth | Seller acq | AnnounceCardCta | P1 | Same BUY-001 seller path | Alta | P0 | Anunciar esta carta | `/login` hardcode | `/entrar?next=` | S | Frontend |
| SEL-001 | Plans | Seller | planHasFeature sandbox | P1 | Plan gates inválidos em demo | Alta | P1 | free + APP_MODE development | Default APP_MODE=development elevates | Default beta/prod env; enforce server | M | Platform |
| SEL-002 | Sandbox | Seller | useSandboxEntitlements fail-open | P1 | Elevate se API falha | Alta | P1 | sandbox status 5xx | catch → elevated true | Fail-closed no client | S | Frontend |
| SEL-003 | Nav | Seller | Vender header vs menu | P2 | Inconsistência discovery | Média | P2 | Guest menu vs header | Menu gated; header always | Alinhar destinos | S | Frontend |
| SEL-004 | Onboarding | Seller | /stores/create | P2 | Submit sem auth UX | Média | P2 | Abrir create guest | Sem useRequireAuth | Redirect /entrar | S | Frontend |
| SEL-005 | Plans | Seller | Cupons | P2 | Item aberto → plan_forbidden | Média | P2 | free → cupons | Sidebar sem feature lock | Matrix + PageEmpty | S | Frontend |
| SEL-006 | Events | Seller | Torneios empty | P2 | Empty pobre vs PageShell | Média | P3 | Sem store / plan | Copy cru | PageEmpty pattern | S | Frontend |
| SEL-007 | Legacy | Seller | CreateListingForm /login | P3 | Path legado | Baixa | P3 | Form antigo | Hardcode /login | Deprecate path | S | Frontend |
| SEC-001 | Sec | Financial | FP mutators | P0 | Qualquer authed post journal/payout | Alta | P0 | POST journals autenticado | Sem PermissionService | Gate store.finance.* | L | API |
| SEC-002 | Sec | Tournament | TP writes | P0 | IDOR staff/penalties/regs | Alta | P0 | POST staff/penalty | Só _require_user | can_event em writes | L | API |
| SEC-003 | Sec | Tournament | Sensitive GETs | P1 | PII dashboards | Alta | P1 | GET event-dashboard | Sem auth | Auth+RBAC | M | API |
| SEC-004 | Sec | Store | store_id query dashboards | P1 | Cross-store read | Alta | P1 | GET store-dashboard?store_id= | Sem membership check | PermissionService | M | API |
| SEC-005 | Sec | Auth | JWT non-prod | P1 | Spoof X-Judge-User-Id | Alta | P1 | staging environment!=production | JWT só se ENVIRONMENT=production | Enforce por APP_MODE | M | API |
| SEC-006 | Sec | Tournament | confirm_result | P1 | Qualquer participante confirma | Média | P1 | confirm ≠ opponent | flow.py open | Só players da mesa / judge | M | API |
| SEC-007 | Sec | Financial | subject_id health | P2 | Health alheia | Média | P2 | financial-health?subject_id= | Param livre | Self/admin only | S | API |
| RBAC-001 | RBAC | Tournament | create_event soft-open | P0 | Evento em qualquer store | Alta | P0 | POST events | `if not can: pass` | 403 hard | S | API |
| RBAC-002 | RBAC | Tournament | _require_organizer | P1 | Staff events perms inúteis no RC1 | Alta | P1 | Judge com store.events.* | created_by only | Wire PermissionService | L | API |
| RBAC-003 | RBAC | Identity | hardcoded head_judge admin | P2 | Contorna matriz | Média | P2 | _is_platform_admin | Role string set | Só SUPER_ADMIN | S | API |
| RBAC-004 | RBAC | Dual-read | events vs seller_rbac | P2 | Gap dual-read | Média | P2 | Legacy roles events | Sem map LEGACY events | Map ear cutover | M | API |
| JUD-001 | Biz | Financial | FP ≠ checkout | P1 | Wallet demo ≠ pagamento | Alta | P0 | Comprar com “wallet” UI | Explicitamente não wired | Flag cutover + wire finalize | XL | Product |
| JUD-002 | Docs | Tournament | Docs diz wired | P2 | Falsa confiança | Alta | P2 | JUDGE_PLATFORM.md | Soft-open create_event only | Fix code or docs | S | Docs |
| ADM-001 | Sandbox | Admin | Empty allowlist | P1 | Todos SUPER_ADMIN em sandbox | Alta | P0 | APP_MODE=sandbox emails="" | Design DX | Allowlist obrigatória | S | Platform |
| ADM-002 | Sandbox | Admin | APP_MODE typo → development | P1 | Elevation acidental | Média | P1 | APP_MODE=staging | Fallback development | Fail-closed unknown | S | Platform |
| ADM-003 | Sandbox | FE | plan/features elevate | P1 | UI Enterprise sem backend | Alta | P1 | canElevateSandbox true | FE unconditional | Só elevated API | S | Frontend |
| ADM-004 | Sandbox | Seed | seed + status headers | P2 | Spoof / force beta | Média | P2 | Headers email | Trust header | JWT required | M | API |
| ADM-005 | Admin | Tournament | sync-cards “admin” | P2 | Sync caro autenticado | Média | P2 | POST sync-cards | Só _require_user | platform.admin | S | API |
| SEA-01 | Analytics | Search | GlobalSearchBar | P1 | Funil search cego no header | Alta | P1 | Digitar no header | Sem trackEvent | Emit search | S | Analytics |
| SEA-02 | Analytics | Search | FacetedSearch payload | P0 | Contrato result_count quebrado | Alta | P0 | Busca loja | results_count vs result_count | Align payload | S | Analytics |
| SEA-03 | Analytics | Search | track on total change | P1 | Falsos zero-results | Média | P1 | Load page | Effect sem !loading | Gate emit | S | Frontend |
| SEA-04 | UX | Search | Zero results header | P2 | Mensagem fraca | Média | P3 | Query vazia results | Só texto | Empty CTA | S | Frontend |
| ANA-01 | Analytics | Platform | BP2/BP3 emit | P0 | Eventos não persistidos | Alta | P0 | Create event platform | emit → logger only | record_analytics_events | M | API |
| ANA-02 | Analytics | Platform | FE AnalyticsEventName | P0 | Sem typed FE emitters | Alta | P0 | — | Server-only + não persiste | Persistir + tipar | M | Analytics |
| ANA-03 | Analytics | TopMovers | compare never fired | P1 | Dead registry name | Média | P2 | — | Sem caller | Emit or deprecate | S | Analytics |
| ANA-04 | Analytics | Coverage | Ghost typed events | P1 | Falsa cobertura | Alta | P2 | Wishlist etc | Tipados sem track | Wire or prune | M | Analytics |
| ANA-05 | Docs | Taxonomy | Stale FIRED_DROPPED | P2 | Docs vs Beta1.5 | Alta | P3 | EVENT_TAXONOMY | Não atualizado | Sync docs | S | Docs |
| PERF-01 | Perf | Search | /loja/busca Lighthouse | P0 | Cold Perf ~80 instável | Alta | P0 | Lighthouse docs | FacetedSearch SSR false + peso | Profile + budget gate | L | Frontend |
| PERF-02 | Perf | Search | Heavy client stack | P1 | Main-thread search | Alta | P1 | Profiles | Idle + ssr:false | RSC-first facets | L | Frontend |
| PERF-03 | Perf | Hydration | Watcher global | P2 | Runtime cost | Média | P3 | MinimalProviders | console.error patch | Scope pages | S | Frontend |
| FIN-01 | Financial | Wallet | Dual APIs | P0 | Duas fontes de verdade | Alta | P0 | identity vs /runtime/wallet | BP3 additive | Unificar cutover plan | L | Product |
| FIN-02 | Financial | Seller | Dual finance UI | P1 | PIX real vs platform shell | Alta | P1 | Menu sandbox | Parallel shells | Label demo vs live | S | Frontend |
| FIN-03 | Financial | Buyer | checkout_wired hidden | P2 | Zeros sem contexto | Alta | P2 | Carteira page | Não mostra flag | Exibir “não usa checkout” | S | Frontend |
| UX-01 | UX | Nav | Loja vs Comprador mobile | P1 | Sobreposição semântica | Alta | P1 | Bottom nav | Labels ambíguos | Renomear hub / ícone | S | Frontend |
| UX-02 | UX | Header | BP3.5 OK header | P3 | Residual bottom/demo | Baixa | P3 | — | Header aligned | Monitor metrics | — | — |

**Totals:** P0≈14 · P1≈28 · P2≈20 · P3≈ restante (≈55 tracked rows).
