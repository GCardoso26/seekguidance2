# Estratégia mobile e publicação

## Build e release

- **Expo Application Services (EAS)** para pipelines Android/iOS.
- Perfis: `development`, `preview` (internal), `production`.

## Android

1. Keystore em **EAS Secrets** ou GCP Secret Manager.
2. Play Console: faixa interna → closed → produção.
3. **Edge-to-edge** já habilitado no `app.json` gerado.

## iOS

1. Apple Developer + certificados gerenciados pelo EAS.
2. TestFlight para QA jurídico (textos de disclaimer).
3. App Store Review: destacar que o app **cita fontes oficiais** e não substitui decisão humana de juiz de topo nível em eventos sanctionados.

## Identifiers

- Android: `com.tcgjudge.app`
- iOS bundle: `com.tcgjudge.app`

## Deep links

Esquema `tcgjudge://` para abrir chat com `game_slug` pré-selecionado.

## Acessibilidade

Contraste AA no modo escuro; tamanhos dinâmicos de fonte; leitores de tela nos componentes de cartão.
