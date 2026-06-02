# Product Retention (Wave 2B)

## Epics entregues

1. **Auth + histórico cloud** — Supabase Google, sessões Postgres, deep links `?session=`
2. **Open Graph** — `/api/og/verdict`, partilha assinada `?share=&sig=`
3. **Related Questions** — sugestões pós-resposta + métricas CTR
4. **Star Wars Unlimited** — registry, ingestão, perfil de confiança, badge BETA
5. **Growth analytics** — tabela + dashboard
6. **UX** — histórico agrupado, pesquisa, favoritos (local), quick actions, skeleton SSE

## Degradação graciosa

- Redis/Supabase/Postgres indisponíveis: Judge anónimo + localStorage
- Métricas e partilha: best-effort (202/503 sem bloquear consulta)

## Compatibilidade

Contratos `POST /runtime/judge/query` e SSE inalterados; campos novos são opcionais.
