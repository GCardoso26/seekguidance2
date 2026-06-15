# Auditoria tcghub.ai — 2026-06-06

**Atualização 2026-06-06 (pós-correção):** Itens **críticos** e **altos** prioritários foram corrigidos no frontend. Ver secção [Remediação aplicada](#remediação-aplicada).

**Escopo:** `frontend/runtime_console_v3` (Next.js 15.5.19) + infraestrutura raiz do monorepo `tcg-judge`  
**Método:** `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm audit`, varredura estática do código e revisão de regressões solicitadas.

---

## Remediação aplicada

| Item | Status |
|------|--------|
| Session API — spoofing `X-Judge-User-Id` | ✅ `getAuthenticatedUserId()` via Supabase; cliente usa `/api/judge/session` |
| Open redirect OAuth `//evil.com` | ✅ `safe-path.ts` + `normalizeInternalPath` |
| Limites de plano só no client | ✅ `/api/judge/query` + `/stream` com cookie HMAC + tier Stripe |
| `NEXT_PUBLIC_JUDGE_ADMIN_EMAILS` no bundle | ✅ `judge-rbac-server.ts` (`JUDGE_ADMIN_EMAILS` server-only) |
| Analytics sem rate limit | ✅ 60 req/min/IP + validação de payload |
| `metadataBase` ausente | ✅ `layout.tsx` com `NEXT_PUBLIC_APP_URL` |
| Poll health duplicado | ✅ Removido de `JudgePageClient`; `ServiceStatusDot` único |
| `saveJudgeSession` a cada pergunta | ✅ Debounce 2s em `judge-cloud-history.ts` |
| God component `JudgePageClient` | ⚠️ Parcial — extraído `useJudgePageInit` (~700 linhas restantes) |
| `bg-white` legado | ✅ `LoginButton`, `ConsentBanner`, `JudgeHistory`, `SourceCard` |
| `tsc` em testes | ✅ 3 erros corrigidos |
| `npm audit` (11 vulns) | ⏳ Pendente — requer bump controlado de deps (vitest/esbuild/sentry) |

**Validação pós-correção:** `npm run build` ✅ · `npx tsc --noEmit` ✅ · `vitest` 121 testes ✅

---

## Resumo

| Métrica | Resultado |
|---------|-----------|
| **Total de issues** | **38** |
| Crítico | 3 |
| Alto | 11 |
| Médio | 16 |
| Baixo | 8 |
| **Build** | ✅ Passa |
| **Lint** | ⚠️ Passa com **16 warnings** (0 errors) |
| **Type-check (`tsc --noEmit`)** | ❌ **3 erros** (apenas em `tests/`) |

---

## Issues por Categoria

### 1. Build e Tipo

| Severidade | Arquivo | Linha | Descrição | Correção |
|------------|---------|-------|-----------|----------|
| MÉDIO | `tests/lib/game-log-crypto.test.ts` | 16 | Propriedade `hash` inválida em `HashableGameLogEntry` | Alinhar tipo do teste com a interface real |
| MÉDIO | `tests/supabase/key-guard.test.ts` | 18, 22 | Atribuição a `NODE_ENV` (readonly) | Usar `vi.stubEnv` ou mock isolado |
| BAIXO | `src/app/ingestion/page.tsx` | 6 | Import `MetricPanel` não utilizado | Remover import |
| BAIXO | `src/app/judge/JudgePageClient.tsx` | 43 | `clearThreadForTcg` importado e não usado | Remover import |
| BAIXO | `src/app/judge/JudgePageClient.tsx` | 511-513 | `useEffect` sem `runQuestion` nas deps; eslint-disable obsoleto | Revisar deps ou ref estável com `useRef` |
| BAIXO | `src/components/judge/TcgSelector.tsx` | 99-125 | `setDraggingId`/`setDropHover` instáveis em `useCallback` | Memoizar fallbacks do contexto opcional |
| BAIXO | Vários (`health-badge`, `judgeApi`, infractions, etc.) | — | 10+ warnings `no-unused-vars` em código legado | Limpar ou prefixar `_` consistentemente |
| BAIXO | `src/components/judge/ShareVerdictButton.tsx` | — | Componente órfão (substituído por `ShareVerdict.tsx`) | Remover ou re-exportar |
| BAIXO | `src/components/judge/JudgeHistory.tsx` | — | Não wired na UI (`MatchLog`/`ConsultationHistory` usados) | Remover ou integrar |
| BAIXO | `src/features/auth/ProtectedHistory.tsx` | — | Nunca importado | Remover dead code |

**Nota:** O build Next.js inclui type-check do `src/` e passa. Falhas de `tsc` estão isoladas em testes Vitest.

---

### 2. Segurança

| Severidade | Arquivo | Linha | Descrição | Correção |
|------------|---------|-------|-----------|----------|
| **CRÍTICO** | `src/app/api/judge/session/route.ts` | 6-16 | `X-Judge-User-Id` aceito do cliente sem validar sessão Supabase | Obter `user.id` via `supabase.auth.getUser()` no servidor; ignorar header do browser |
| **CRÍTICO** | `src/app/api/judge/session/[uuid]/route.ts` | 9 | Mesmo padrão de spoofing de user ID | Idem |
| **CRÍTICO** | `src/lib/auth/oauth-redirect.ts` | 14-16, 137-141 | `normalizePath("//evil.com")` mantém URL protocol-relative → open redirect | Rejeitar paths que começam com `//` ou contêm `:`; allowlist de rotas internas |
| ALTO | `src/hooks/usePlanLimits.ts` + `src/lib/judge-daily-usage.ts` | — | Limites de plano só em `localStorage` — bypass trivial no DevTools | Enforçar no backend (`/runtime/judge/query`) + validar subscription server-side |
| ALTO | `src/app/api/analytics/track/route.ts` | 5-21 | POST público sem auth nem rate limit | Exigir sessão ou token; rate limit por IP/user |
| ALTO | `src/lib/judge-rbac.ts` | 4-8 | `NEXT_PUBLIC_JUDGE_ADMIN_EMAILS` expõe lista de admins no bundle | Mover para variável server-only; RBAC só no servidor |
| ALTO | `src/services/api/client.ts` | 17-25 | Rotas `/runtime/judge/*` sempre `publicRoute` via `/api/proxy` | Rate limiting + captcha/WAF na API upstream; quotas por user/IP |
| MÉDIO | `src/components/judge/RuleSourceCard.tsx` | 88-108 | `dangerouslySetInnerHTML` | Mitigado por `escapeHtml` em `highlight-excerpt.ts` — considerar DOMPurify para defesa em profundidade |
| MÉDIO | `src/components/judge/SourceCard.tsx` | 119 | Idem | Idem |
| MÉDIO | `next.config.mjs` | 15-16 | CSP produção com `'unsafe-inline'` em scripts | Migrar para nonces/hashes onde possível |
| MÉDIO | `src/features/auth/UserMenu.tsx` | 39-44 | `<img>` OAuth sem domínio restrito | Preferir `next/image` com `remotePatterns` já configurados |
| BAIXO | `src/app/api/health/route.ts` | — | Health mock público (aceitável) | Em prod, proxy para health real sem dados sensíveis |
| BAIXO | `.env.example` | — | Sem `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE` documentados no servidor | Adicionar secção server-only com comentários |

**OAuth redirect (positivo):** `middleware.ts` valida cookie `tcg_oauth_return` com `startsWith("/") && !startsWith("//")` — correto no servidor; gap está no client `oauth-redirect.ts`.

---

### 3. Performance

| Severidade | Arquivo | Linha | Descrição | Correção |
|------------|---------|-------|-----------|----------|
| ALTO | `src/app/judge/JudgePageClient.tsx` | — | **763 linhas** — God component (estado, SSE, histórico, paywall, URL) | Extrair: `useJudgeConsultation`, `JudgeCenterZone`, drawer já separado |
| MÉDIO | `src/app/judge/page.tsx` | — | First Load JS **301 kB** na rota `/judge` | Code-split `ConsultationHistory`, Framer em rotas pesadas |
| MÉDIO | `src/app/observability/page.tsx` | — | Bundle **110 kB** | Lazy load charts |
| MÉDIO | `src/app/judge/JudgePageClient.tsx` | 162-163 | Poll health a cada 30s + `ServiceStatusDot` idem | Consolidar num único provider de health |
| MÉDIO | `src/lib/judge-cloud-history.ts` | 31-34 | `saveJudgeSession` envia array local completo a cada pergunta | PATCH incremental ou debounce |
| MÉDIO | `src/providers/theme-provider.tsx` | 7-8 | `ThemeProvider` client-side desnecessário se tema fixo dark | Remover toggle ou forçar dark sem estado |
| BAIXO | `src/features/auth/GoogleLoginButton.tsx` | 27 | `bg-white` + sem `next/font` para Google branding | Aceitável; opcional otimizar |
| BAIXO | `src/components/ConsentBanner.tsx` | 25 | `bg-white/95` — paint claro no rodapé | Token dark `bg-slate-900/95` |
| BAIXO | `next.config.mjs` | 34 | `reactStrictMode: true` | Pode duplicar effects em dev (esperado) |

---

### 5. UX e Acessibilidade

| Severidade | Arquivo | Linha | Descrição | Correção |
|------------|---------|-------|-----------|----------|
| MÉDIO | `src/components/judge/ConsultationHistory.tsx` | — | Drawer sem focus trap nem `aria-modal` no painel | Adicionar trap (Radix Dialog ou `focus-trap-react`) + `Escape` fecha |
| MÉDIO | `src/components/judge/JudgeHistory.tsx` | 157 | `bg-white` + texto `hsl(foreground)` — contraste ruim no tema escuro | Usar tokens `--tcg-surface-elevated` |
| MÉDIO | `src/components/judge/LoginButton.tsx` | 14 | Botão claro no header escuro da mesa | Tokens do tema judge |
| MÉDIO | `src/components/ConsentBanner.tsx` | — | Banner claro sobre app escuro | Harmonizar com dark |
| BAIXO | `src/components/judge/RelatedQuestions.tsx` | — | Chips pequenos em mobile — verificar 44×44px | `min-h-11` nos botões |
| BAIXO | `src/components/social/CreateCommunityModal.tsx` | — | Modal sem focus trap | Usar Radix Dialog |
| **OK** | `src/components/judge/JudgeLayout.tsx` | 66 | Skip link `#judge-main` presente | — |
| **OK** | `src/components/judge/ShareVerdict.tsx` | 68 | `aria-label="Partilhar veredito"` | — |
| **OK** | `src/styles/judge-tcg.css` | 122 | `@media (prefers-reduced-motion: reduce)` | Vários componentes usam `useReducedMotion` |

---

### 6. Regressões e Estado Atual

| Severidade | Item | Status | Detalhe |
|------------|------|--------|---------|
| **OK** | Warmup / Métricas / Console ocultos | ✅ | `SHOW_WARMUP_BADGE`, `SHOW_HEALTH_BADGE`, `SHOW_ADMIN_ACTIONS` = `false` com render condicional em `JudgeLayout.tsx` — **não é só CSS** |
| ALTO | Tema escuro global | ⚠️ | `<html className="dark">` em `layout.tsx` ✅, mas `ThemeProvider` pode aplicar classe `light` se `toggle()` for usado no futuro |
| ALTO | Componentes legados claros | ⚠️ | `JudgeHistory`, `SourceCard`, `ErrorPanel`, `ShareVerdictButton`, `ConsentBanner` usam `bg-white` |
| MÉDIO | Histórico local + cloud | ⚠️ | `persistJudgeHistoryItem` grava local **e** reenvia sessão cloud inteira — risco de divergência, não duplicação na UI |
| MÉDIO | Paywall `usePlanLimits` | ⚠️ | Funciona para UX; **não impede** abuso real sem backend |
| **OK** | `?share=` deep link | ✅ | `JudgePageClient` + `fetchJudgeShare` + middleware OAuth intactos |
| MÉDIO | OG / metadata | ⚠️ | Build warning: `metadataBase` ausente — previews podem usar `localhost` |
| N/D | Drag & drop iOS/Android | — | Não testado em dispositivo real nesta auditoria; implementação touch em `TcgSelector.tsx` presente |
| N/D | SSE troca rápida de TCG | — | Não há `AbortController` visível ao trocar TCG mid-stream — possível race (revisar manualmente) |

---

### 7. Infraestrutura e Deploy

| Severidade | Item | Descrição | Correção |
|------------|------|-----------|----------|
| ALTO | `npm audit` | **11 vulnerabilidades** (1 critical, 3 high, 7 moderate) em cadeia vitest/esbuild, postcss/next, sentry/rollup | Atualizar dependências de forma controlada; esbuild afeta **dev**, postcss/sentry merecem prioridade |
| MÉDIO | `.github/workflows/vercel-deploy-hook.yml` | Deploy automático falha sem `VERCEL_TOKEN`; hook pode cancelar builds | Configurar `VERCEL_TOKEN` no GitHub Secrets |
| MÉDIO | `next.config.mjs` | CSP, HSTS (prod), `remotePatterns` ✅ | Falta `metadataBase` no layout |
| MÉDIO | `src/middleware.ts` | Protege admin/observability; OAuth redirect ✅ | Sem rate limiting global |
| BAIXO | `.env.example` | Documentação razoável para Supabase/Stripe público | Completar vars server-only |
| BAIXO | `src/lib/sentry.ts` + `SentryInit.tsx` | Error tracking configurado | Verificar DSN em produção |
| **OK** | `.gitignore` | `.env.local` tipicamente ignorado | Confirmar que secrets não estão commitados |
| **OK** | CI | `.github/workflows/ci.yml` presente | — |

---

## Recomendações Priorizadas

1. **[CRÍTICO]** Validar sessão Supabase nas rotas `api/judge/session/*` — nunca confiar em `X-Judge-User-Id` do cliente.
2. **[CRÍTICO]** Corrigir open redirect em `normalizePath` / `performOAuthRedirect` (bloquear `//`).
3. **[CRÍTICO]** Enforçar quotas de plano e rate limit no backend de `/runtime/judge/query`, não só no frontend.
4. **[ALTO]** Refatorar `JudgePageClient.tsx` (763 linhas) em hooks + subcomponentes.
5. **[ALTO]** Mover `JUDGE_ADMIN_EMAILS` para env server-only.
6. **[ALTO]** Proteger `POST /api/analytics/track` com rate limit.
7. **[ALTO]** Definir `metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL)` no `layout.tsx`.
8. **[MÉDIO]** Limpar 16 warnings de lint e corrigir 3 erros de `tsc` nos testes.
9. **[MÉDIO]** Adicionar focus trap nos drawers/modais (`ConsultationHistory`, `CreateCommunityModal`).
10. **[MÉDIO]** Substituir `bg-white` residual em componentes judge legados por tokens dark.

---

## Arquivos Saudáveis (amostra)

| Arquivo | Observação |
|---------|------------|
| `src/lib/highlight-excerpt.ts` | Escape HTML antes de `dangerouslySetInnerHTML` |
| `src/middleware.ts` | OAuth cookie validado; admin guard |
| `src/lib/auth/oauth-redirect.ts` | Cookie + TTL + clear state (exceto gap `//`) |
| `src/components/judge/VerdictIcon.tsx` | `useReducedMotion` |
| `src/components/judge/JudgeThread.tsx` | `AnimatePresence` + reduced motion |
| `src/components/premium/FeatureGate.tsx` | Testado em `tests/components/premium/` |
| `src/hooks/useSubscription.ts` | Integração Stripe com fallback free |
| `next.config.mjs` | Headers de segurança e CSP por ambiente |

---

## Comandos Executados

```bash
cd frontend/runtime_console_v3
npm run build      # exit 0
npm run lint       # exit 0, 16 warnings
npx tsc --noEmit   # exit 2 (3 errors in tests/)
npm audit          # 11 vulnerabilities
```

---

## Notas Finais

- A auditoria **não** reativou Warmup/Métricas/Console — confirmado ocultos por flag booleana.
- SSE, threads por TCG, match log e fluxo OAuth **não foram alterados** nesta auditoria (somente leitura).
- Categoria 4 (SEO/i18n) não estava na checklist do pedido — omitida intencionalmente.
- Testes E2E em dispositivos móveis reais e pentest do backend FastAPI ficam fora do escopo deste relatório frontend.

---

*Gerado automaticamente pela varredura de código em 2026-06-06.*
