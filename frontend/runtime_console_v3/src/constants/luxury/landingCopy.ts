export type AudienceSegment = "home" | "player" | "judge" | "lgs";

export type HeroCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  segmentCtas?: { label: string; href: string; emoji: string }[];
  scrollLabel: string;
};

export const HERO_COPY: Record<AudienceSegment, HeroCopy> = {
  home: {
    eyebrow: "A autoridade na mesa",
    title: "A ruling certa antes do clock zerar",
    subtitle:
      "Juízes consistentes. Jogadores confiantes. Torneios que começam e acabam na hora.",
    segmentCtas: [
      { emoji: "🎮", label: "Sou jogador", href: "/jogador" },
      { emoji: "⚖️", label: "Sou juiz", href: "/juiz" },
      { emoji: "🏪", label: "Tenho loja", href: "/loja" },
    ],
    scrollLabel: "Ver como funciona",
  },
  player: {
    eyebrow: "Para jogadores competitivos",
    title: "A ruling que você precisa antes do clock acabar",
    subtitle:
      "Você não tem 15 minutos para postar no Discord. Não pode confiar no \"acho que sim\" do oponente. A mesa te dá a ruling oficial em segundos — com a fonte para mostrar ao juiz.",
    primaryCta: { label: "Testar minha primeira ruling", href: "/judge" },
    secondaryCta: { label: "Ver planos", href: "/pricing" },
    scrollLabel: "Ver como funciona",
  },
  judge: {
    eyebrow: "Para juízes de torneio",
    title: "Zero appeal por inconsistência",
    subtitle:
      "Cite a fonte. Justifique o veredito. Proteja-se do appeal. A mesa não substitui seu conhecimento — mas quando a dúvida bate, ela te dá a ruling certa com documentação oficial.",
    primaryCta: { label: "Ver como funciona para juízes", href: "/judge" },
    secondaryCta: { label: "Falar com a equipe", href: "mailto:contato@judgetcg.com.br?subject=Juiz%20de%20torneio" },
    scrollLabel: "Ver capacidades",
  },
  lgs: {
    eyebrow: "Para donos de loja",
    title: "Seu torneio começa na hora",
    subtitle:
      "Pairing automático. Bracket correto. Rulings oficiais. Sua loja com a infraestrutura de um YCS — mesmo que você seja uma loja de bairro.",
    primaryCta: { label: "Transformar meus torneios", href: "mailto:contato@judgetcg.com.br?subject=Plano%20LGS" },
    secondaryCta: { label: "Calcular para minha loja", href: "/pricing#lgs" },
    scrollLabel: "Ver o que inclui",
  },
};

export const PAIN_SECTIONS: Record<
  Exclude<AudienceSegment, "home">,
  { eyebrow: string; title: string; body: string; cta: string; ctaHref: string }
> = {
  player: {
    eyebrow: "Na mesa, sob pressão",
    title: "Quando o clock está em 2:00 e você precisa saber agora",
    body: "Você não tem 15 minutos para postar no Discord. Não pode confiar no \"acho que sim\" do oponente. A mesa te dá a ruling oficial em segundos — com a fonte para mostrar ao juiz se necessário.",
    cta: "Abrir a Mesa",
    ctaHref: "/judge",
  },
  judge: {
    eyebrow: "Credibilidade em jogo",
    title: "O appeal que você evitou",
    body: "Você deu a ruling. O jogador contestou. Você não lembra a fonte exata. O Head Judge é chamado. O jogo para. O evento atrasa. A mesa te dá a ruling certa com a fonte oficial — antes do appeal acontecer.",
    cta: "Ver como funciona para juízes",
    ctaHref: "/judge",
  },
  lgs: {
    eyebrow: "Retenção de jogadores",
    title: "O torneio que começa 19h e acaba 19h05",
    body: "Você já perdeu jogadores porque o pairing demorou 20 minutos. Porque o bracket foi feito errado. Porque não tinha juiz e você teve que decidir no olho. Seus jogadores não vão embora. Eles trazem amigos.",
    cta: "Quero transformar meus torneios",
    ctaHref: "mailto:contato@judgetcg.com.br?subject=Plano%20LGS",
  },
};

export const SOCIAL_STATS = [
  { value: "14.000+", label: "rulings consultadas" },
  { value: "500+", label: "torneios rodados" },
  { value: "14", label: "TCGs suportados" },
  { value: "98%", label: "confiança nas fontes" },
] as const;

export const SHOWCASE_COPY: Record<
  AudienceSegment,
  { eyebrow: string; title: string; description: string; cta: string; question: string; answer: string; meta: string }
> = {
  home: {
    eyebrow: "A Mesa",
    title: "A mesa que os juízes usam",
    description: "Pergunta. Receba a ruling oficial. Mostre a fonte.",
    cta: "Experimentar a mesa",
    question: "Meu oponente invocou sem costo. Posso negar?",
    answer:
      "Depende do efeito e do timing da invocação. A mesa analisa a situação, cita a regra aplicável (PSCT / CR / MTR) e entrega o veredito com fonte para você ou o juiz confirmar.",
    meta: "Confiança 94% · 3 fontes oficiais",
  },
  player: {
    eyebrow: "A Mesa",
    title: "Sua dúvida em 10 segundos",
    description: "Com fonte oficial para mostrar ao oponente ou ao floor judge.",
    cta: "Testar minha primeira ruling",
    question: "Meu oponente invocou sem costo. Posso negar?",
    answer:
      "A resposta depende do efeito ativado. A mesa identifica a interação, cita a regra e entrega o veredito — pronto para você apresentar na mesa.",
    meta: "8 segundos · fonte citada",
  },
  judge: {
    eyebrow: "A Mesa",
    title: "Ruling rápida, justificada",
    description: "Confirme interações raras com policy, MTR e documentos oficiais antes do appeal.",
    cta: "Ver como funciona para juízes",
    question: "Floor judge: o jogador ativou na janela errada. Qual a ruling correta?",
    answer:
      "A mesa referencia a policy aplicável, explica o timing e fornece a justificativa com fonte — para você sustentar o veredito perante appeal.",
    meta: "MTR · IPG · fonte oficial",
  },
  lgs: {
    eyebrow: "A Mesa",
    title: "Torneio que não atrasa",
    description: "Pairing, bracket e rulings oficiais — credibilidade que retém jogadores.",
    cta: "Transformar meus torneios",
    question: "Round 3: dois jogadores contestam a mesma interação. Qual a ruling?",
    answer:
      "Resposta consistente com fonte oficial — seus floor judges alinhados, menos pausa, evento no horário.",
    meta: "Consistência · menos appeal",
  },
};

export const FEATURES_SECTION_COPY: Record<AudienceSegment, { eyebrow: string; title: string; subtitle: string }> = {
  home: {
    eyebrow: "Capacidades",
    title: "Engenharia para a mesa",
    subtitle: "Cada funcionalidade foi desenhada com juízes, organizadores e jogadores competitivos.",
  },
  player: {
    eyebrow: "Para você na mesa",
    title: "Confiança antes de jogar a carta",
    subtitle: "Velocidade, fonte e clareza — quando cada segundo do clock importa.",
  },
  judge: {
    eyebrow: "Para o floor",
    title: "Consistência que protege o evento",
    subtitle: "Mesma ruling, mesma fonte, em todo o salão — do store champ ao regional.",
  },
  lgs: {
    eyebrow: "Para sua loja",
    title: "Infraestrutura que retém jogadores",
    subtitle: "Torneio profissional sem equipe de YCS — pairing, bracket e rulings integrados.",
  },
};

export const TESTIMONIALS_SECTION_COPY: Record<AudienceSegment, { eyebrow: string; title: string }> = {
  home: { eyebrow: "Confiança", title: "Quem confia na mesa" },
  player: { eyebrow: "Jogadores", title: "Quem já ganhou tempo no clock" },
  judge: { eyebrow: "Juízes", title: "Quem já evitou appeal" },
  lgs: { eyebrow: "Lojas", title: "Quem dobrou a mesa" },
};

export const PRICING_SECTION_COPY: Record<AudienceSegment, { eyebrow: string; title: string; subtitle: string }> = {
  home: {
    eyebrow: "Investimento",
    title: "Planos para cada perfil",
    subtitle: "Do casual ao LGS — escolha o que combina com como você joga, julga ou organiza.",
  },
  player: {
    eyebrow: "Investimento",
    title: "R$ 29/mês = confiança em todo regional",
    subtitle: "Menos que um booster. Mais que horas no Discord esperando resposta.",
  },
  judge: {
    eyebrow: "Investimento",
    title: "Investimento no seu evento",
    subtitle: "Consistência de ruling que protege sua credibilidade como head judge.",
  },
  lgs: {
    eyebrow: "Investimento",
    title: "Retorno em retenção de jogadores",
    subtitle: "Credibilidade profissional que faz jogadores voltarem — e trazerem amigos.",
  },
};

export const CTA_FINAL_COPY: Record<AudienceSegment, { title: string; subtitle: string; cta: string; href: string }> = {
  home: {
    title: "Sua próxima ruling começa em 10 segundos",
    subtitle: "A mesa está aberta.",
    cta: "Abrir a Mesa",
    href: "/judge",
  },
  player: {
    title: "Sua próxima ruling começa em 10 segundos",
    subtitle: "Teste agora — sem cartão, sem compromisso.",
    cta: "Testar minha primeira ruling",
    href: "/judge",
  },
  judge: {
    title: "Proteja seu próximo evento",
    subtitle: "Ruling rápida, fonte citada, appeal evitado.",
    cta: "Ver como funciona para juízes",
    href: "/judge",
  },
  lgs: {
    title: "Seu torneio da próxima semana pode ser diferente",
    subtitle: "Fale com a equipe e monte o plano para sua loja.",
    cta: "Calcular para minha loja",
    href: "mailto:contato@judgetcg.com.br?subject=Plano%20LGS",
  },
};

export const TCG_GALLERY_COPY = {
  eyebrow: "Ecossistema",
  title: "Os jogos que você já joga",
  subtitle: "Destaque para os mais jogados no Brasil — e mais 11 TCGs na mesma plataforma.",
};
