# SOCIAL_LAYER — Acceptance

**Date:** 2026-07-22  
**Epic:** 8 — Social Layer

## Verdict

**PASS (composição)** — Seguir (API existente), feed unificado, curtidas/favoritar/compartilhar decks, comentários/discussão, compartilhar coleção/wishlist/progresso/conquistas. Sem novo BC.

## Criteria

| Item | Status |
|------|--------|
| Seguir jogadores | ✅ `FollowButton` + `/api/social/follows` |
| Curtidas / favoritar / share decks | ✅ `DeckSocialActions` |
| Comentários | ✅ `DeckCommentsScaffold` (thread + notas) |
| Feed | ✅ `SocialActivityFeed` em `/social` |
| Share coleção/wishlist | ✅ `SharePlayerArtifactButton` |
| Perfis públicos | ✅ `/u/[username]` existente |

## Note
Likes de deck usam counter + localStorage até POST like nativo no Decks API; UI está pronta.
