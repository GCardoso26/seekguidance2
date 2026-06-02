# Conformidade LGPD (Wave 2B)

## Implementado

- Página `/privacidade` no frontend
- `ConsentBanner` no primeiro acesso (`judge:consent` em localStorage)
- `DELETE /runtime/judge/account` — remove sessões, favoritos e métricas por `user_id`

## Antes do go-live com Auth

1. Assinar DPA Supabase: https://supabase.com/dpa
2. Configurar Google OAuth no projeto Supabase
3. Usar apenas chave **anon** em `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver `docs/SECURITY_CREDENTIAL_ROTATION.md`)

## Exclusão completa

A API remove dados nas tabelas `tcg_judge.*`. Para remover a conta Auth no Supabase, usar Admin API ou Dashboard → Authentication → Users.
