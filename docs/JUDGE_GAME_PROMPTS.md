# Judge — Prompts por jogo

Diretório: `app/judge_prompts/`

| game_slug | Módulo |
|-----------|--------|
| mtg | `mtg.py` |
| pokemon | `pokemon.py` |
| yugioh | `yugioh.py` |
| lorcana | `lorcana.py` |
| onepiece | `onepiece.py` |

Seleção: `get_game_prompt_bundle(game_slug)` — usado em `LlmComposer` sem alterar contratos públicos.

Cada bundle: system prompt, few-shots, formato de resposta JSON.
