# Rotação de credenciais (incidente .env.example)

Foram encontrados secrets reais em ficheiros `*.example` commitados. **Rode estes passos mesmo após corrigir o repositório** — o histórico git pode ter exposto os valores.

## 1. Supabase

1. [Dashboard](https://supabase.com/dashboard) → projeto → **Settings → API**
2. **Rotate** `service_role` secret (obrigatório — estava em `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Copiar a chave **anon** / **public** para:
   - Vercel: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (verificar payload JWT: `"role":"anon"`)
   - Nunca prefixar `service_role` com `NEXT_PUBLIC_`
4. Se a password do pooler foi exposta: **Database → Reset database password** e atualizar `DATABASE_URL` no Render

## 2. Upstash Redis

1. Console Upstash → database → **Reset token**
2. Atualizar `REDIS_URL` no Render

## 3. OpenAI

1. [API keys](https://platform.openai.com/api-keys) → revogar chave exposta → criar nova
2. Atualizar `OPENAI_API_KEY` no Render

## 4. Judge share HMAC

1. Gerar novo segredo: `openssl rand -base64 48`
2. Atualizar `JUDGE_SHARE_SECRET` no Render
3. Links de partilha antigos deixam de validar (esperado)

## Verificação da chave anon

Decode o payload JWT (parte central, base64url):

```json
{ "role": "anon", "ref": "YOUR_PROJECT_REF", ... }
```

Se `role` for `service_role`, **não** usar no frontend.
