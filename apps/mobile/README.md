# Judge TCG — App Mobile (Expo)

App nativo híbrido: **bottom tabs nativas** + **WebView** apontando para [judgetcg.com.br](https://judgetcg.com.br).

## Tabs

| Tab | Rota web |
|-----|----------|
| Juiz | `/judge` |
| Comunidade | `/social/communities` |
| Torneios | `/search` |
| Perfil | `/player/me` |

## Setup

```bash
cd apps/mobile
npm install
npm start
```

Ou na raiz do monorepo:

```bash
npm run mobile
```

## Variáveis (`.env` ou EAS)

```env
EXPO_PUBLIC_WEB_URL=https://judgetcg.com.br
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
```

## Recursos

- **Push:** Expo Push → `user_push_tokens` via `/api/notifications/expo-subscribe`
- **Offline:** cache de rulings/standings via `postMessage` do WebView
- **Deep links:** `judgetcg://judge`, `judgetcg://tournament/{id}`

## Publicação

```bash
npx eas build --platform all
npx eas submit
```
