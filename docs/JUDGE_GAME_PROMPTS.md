# Prompts por Jogo (Wave 2A)

## Estrutura

`services/api/app/judge_prompts/` — um módulo por `game_slug` exportando `bundle()`.

Registry: `get_game_prompt_bundle(game_slug)` com fallback `generic.py`.

## Adicionar jogo

1. Criar `judge_prompts/{game_slug}.py` com `def bundle() -> GamePromptBundle`
2. Opcional: registrar em `_REGISTRY` em `registry.py`
3. Sem alteração no orchestrator

## Jogos

mtg, pokemon, yugioh, lorcana, onepiece, swu (star_wars_unlimited), generic (fallback)
