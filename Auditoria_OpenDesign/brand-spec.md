# Judge TCG — sistema visual extraído

Fonte: `S:\tcg-judge\frontend\runtime_console_v3\src\styles\design-tokens.css` e `src/app/layout.tsx`.

```css
:root {
  --bg: oklch(0.985 0.006 240);
  --surface: oklch(1 0 0);
  --fg: oklch(0.20 0.025 255);
  --muted: oklch(0.96 0.008 240);
  --border: oklch(0.90 0.012 240);
  --accent: oklch(0.54 0.085 75);
  --font-display: "Source Serif 4", Georgia, serif;
  --font-body: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: ui-monospace, "IBM Plex Mono", monospace;
}
```

Regras observadas:

1. A base é clara, fria e densa; a cor primária é azul-tinta, não roxa.
2. O latão é um acento pontual para foco e destaque, nunca a superfície dominante.
3. Bordas, não sombras pesadas, definem agrupamentos e hierarquia.
4. Títulos usam serifas de caráter editorial; a interface operacional usa IBM Plex Sans.
5. Temas por jogo existem como camada de contexto, com cores, padrões e banners próprios.

## Camadas (P1 OpenDesign)

- **Permanente (comércio):** `/`, `/loja/busca`, PDP, carrinho, checkout, hubs de categoria — shell claro; `?game=` no máximo como chip de taxonomia (cor local), nunca `game-portal` / mood / texture.
- **Contextual (universo):** `/{gameSlug}`, expansões, coleções do portal — `PortalLayout` + CSS vars do jogo.
