import type { TcgType } from "@/types/judge";

export const TCG_EXAMPLE_QUESTIONS: Partial<Record<TcgType, string[]>> = {
  magic: [
    "Land cai no campo virada ou desvirada?",
    "Posso responder à pilha depois de passar prioridade?",
    "Trigger de upkeep resolve antes ou depois de comprar?",
  ],
  yugioh: [
    "Posso ativar Effect Veiler na Draw Phase?",
    "Posso invocar um monstro e atacar no mesmo turno?",
    "Chain Link 2 resolve primeiro — quem escolhe ordem?",
  ],
  pokemon: [
    "Posso recuar um Pokémon ativo para a mão?",
    "Ability vs Attack — qual tem prioridade?",
    "Posso jogar Item na vez do oponente?",
  ],
  digimon: [
    "Posso digivolver no turno do oponente?",
    "Security check com múltiplos triggers — ordem?",
    "Posso ativar Inheritable na mão?",
  ],
  lorcana: [
    "Posso cantar duas músicas no mesmo turno?",
    "Challenge com personagem exerted — permitido?",
    "Posso usar shift no turno em que jogo o personagem?",
  ],
  dragon_ball: [
    "Posso atacar com líder já usado neste turno?",
    "Combo com carta da Drop Area — timing?",
    "Posso ativar Critical no Block Step?",
  ],
  flesh_and_blood: [
    "Posso atacar com duas armas no mesmo turno?",
    "Go again após hit — quantos ataques extras?",
    "Posso defender com mão cheia?",
  ],
};

export function getExampleQuestions(tcg: TcgType): string[] {
  return (
    TCG_EXAMPLE_QUESTIONS[tcg] ?? [
      "Como funciona a pilha de efeitos?",
      "Posso fazer esta jogada no turno do oponente?",
      "Qual a regra oficial para este timing?",
    ]
  );
}
