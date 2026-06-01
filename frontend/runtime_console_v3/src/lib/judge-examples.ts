import type { TcgType } from "@/types/judge";

/** Exemplos de perguntas por jogo para o estado vazio contextual. */
export const JUDGE_EXAMPLES: Record<TcgType, [string, string]> = {
  magic: [
    "O que acontece na fase de manutenção?",
    "Como funciona trample?",
  ],
  pokemon: [
    "Quantos Pokémon posso ter no banco?",
    "O que é a condição especial Envenenado?",
  ],
  lorcana: [
    "Como funciona cantar uma canção?",
    "O que significa exert num personagem?",
  ],
  yugioh: [
    "Quando posso activar efeitos rápidos?",
    "Como funciona a cadeia de efeitos?",
  ],
  one_piece: [
    "Quantas vezes posso atacar por turno?",
    "O que significa DON!! no jogo?",
  ],
  flesh_and_blood: [
    "Como funciona go again?",
    "O que é a zona de arsenal?",
  ],
  gundam: [
    "Como funciona a fase de recursos?",
    "Quando posso fazer deploy de unidades?",
  ],
  digimon: [
    "Como funciona digivolve?",
    "O que acontece quando a memória chega a 10?",
  ],
  dragon_ball: [
    "Como funcionam as cartas Z-Energy?",
    "O que é uma batalha de combo?",
  ],
  sorcery: [
    "Como funcionam os quatro elementos?",
    "O que é uma spell site?",
  ],
  vanguard: [
    "O que é ride e quando posso fazer?",
    "Como funcionam os triggers?",
  ],
  riftbound: [
    "Como funciona a mana no jogo?",
    "Quando posso jogar unidades?",
  ],
  union_arena: [
    "Como funcionam as cartas de personagem?",
    "O que significa activar uma habilidade?",
  ],
  star_wars_unlimited: [
    "Como funciona o sistema de recursos?",
    "Quando posso atacar com uma unidade?",
  ],
};

export function getJudgeExamples(tcg: TcgType): [string, string] {
  return JUDGE_EXAMPLES[tcg];
}
