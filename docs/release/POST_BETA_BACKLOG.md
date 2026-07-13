# Post-Beta Backlog (TODO Pós-Beta)

Itens descobertos na auditoria RC1 — **não implementar agora**.

## Produto / UX

- [ ] Drag/resize colunas Inventory DataTable  
- [ ] Export XLSX inventory  
- [ ] Curva ABC completa + sync history persistido  
- [ ] Import rollback inventory  
- [ ] Frete avançado “em breve” (`/vendedor/painel/configuracoes/frete`)  
- [ ] Textos EN residuais em superfícies seller/admin (auditoria contínua)

## Qualidade

- [ ] Zerar warnings ESLint (~61) ou triagem explícita  
- [ ] axe-core CI em fluxos buyer (hoje: testes estruturais)  
- [ ] Lighthouse budget ≥95 com evidência anexada em staging  
- [ ] Harmonizar status catalog health (`ready_for_marketplace` vs smoke) — harness ajustado; documentar contrato API

## Plataforma

- [ ] Billing GitHub Actions estável  
- [ ] Health BFF DB: root cause “database error” em prod Vercel→Supabase  
- [ ] Alinhar `SHIPPING_V2_ENABLED` default staging  
- [ ] Limpeza de `git stash` locais legados (dev machines)

## Arquitetura (fora de RC)

- [ ] Product Intelligence Context  
- [ ] International Marketplace  
- [ ] Public APIs  
- [ ] Native Mobile GA
