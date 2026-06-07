import type { CreateRulingDTO } from "@/lib/rulings/schema";

export const lorcanaRulings: CreateRulingDTO[] = [
  {
    tcg: "lorcana",
    title: "Bodyguard vs Evasive",
    description:
      "Personagem com Bodyguard e Evasive exertado. Oponente sem Evasive tenta desafiar.",
    question: "O oponente é obrigado a desafiar o Bodyguard mesmo sem ter Evasive?",
    answer:
      "Não. Evasive previne o desafio. Bodyguard diz \"se puder\", e como Evasive impede o desafio, a condição não é satisfeita.",
    source: { type: "comprehensive_rules", document_version: "CR 2026-01-15" },
    cards_involved: [],
    keywords_involved: ["bodyguard", "evasive"],
    hierarchy: "official",
    status: "approved",
    language: "pt-BR",
    tags: ["interaction", "priority", "keywords"],
    version: "CR 2026-01-15",
    effective_from: "2026-01-15",
    created_by: "system",
  },
  {
    tcg: "lorcana",
    title: "Shift em personagem com dano",
    description: "Jogador usa Shift num personagem que já tem fichas de dano.",
    question: "O dano permanece após Shift?",
    answer: "Sim, fichas de dano permanecem no personagem após Shift, salvo efeito que diga o contrário.",
    source: { type: "set_faq", document_version: "Set 5 FAQ" },
    cards_involved: [],
    keywords_involved: ["shift", "damage"],
    hierarchy: "official",
    status: "approved",
    language: "pt-BR",
    tags: ["shift", "damage"],
    version: "Set 5 FAQ",
    effective_from: "2026-02-01",
    created_by: "system",
  },
];
