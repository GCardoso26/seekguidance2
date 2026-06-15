export type TcgTheme = {
  id: string;
  name: string;
  short: string;
  accent: string;
  accentMuted: string;
};

export const TCG_THEMES: TcgTheme[] = [
  { id: "magic", name: "Magic: The Gathering", short: "MTG", accent: "#3b82f6", accentMuted: "#1e3a5f" },
  { id: "pokemon", name: "Pokémon TCG", short: "PKM", accent: "#facc15", accentMuted: "#713f12" },
  { id: "yugioh", name: "Yu-Gi-Oh!", short: "YGO", accent: "#ef4444", accentMuted: "#7f1d1d" },
  { id: "lorcana", name: "Disney Lorcana", short: "LOR", accent: "#a78bfa", accentMuted: "#4c1d95" },
  { id: "one_piece", name: "One Piece", short: "OP", accent: "#f97316", accentMuted: "#7c2d12" },
  { id: "fab", name: "Flesh and Blood", short: "FAB", accent: "#dc2626", accentMuted: "#450a0a" },
  { id: "digimon", name: "Digimon", short: "DGM", accent: "#06b6d4", accentMuted: "#164e63" },
  { id: "dragon_ball", name: "Dragon Ball", short: "DBS", accent: "#f59e0b", accentMuted: "#78350f" },
  { id: "force_of_will", name: "Force of Will", short: "FoW", accent: "#6366f1", accentMuted: "#312e81" },
  { id: "grand_archive", name: "Grand Archive", short: "GA", accent: "#14b8a6", accentMuted: "#134e4a" },
  { id: "swu", name: "Star Wars Unlimited", short: "SWU", accent: "#64748b", accentMuted: "#1e293b" },
  { id: "riftbound", name: "Riftbound", short: "RFT", accent: "#ec4899", accentMuted: "#831843" },
  { id: "weiss", name: "Weiss Schwarz", short: "WS", accent: "#f472b6", accentMuted: "#831843" },
  { id: "vanguard", name: "Cardfight!! Vanguard", short: "CFV", accent: "#22d3ee", accentMuted: "#155e75" },
];

export const FEATURES = [
  {
    icon: "Zap" as const,
    title: "Vereditos em Segundos",
    description:
      "IA treinada em documentos oficiais entrega rulings com fontes citadas — na mesa, sem pausas longas.",
  },
  {
    icon: "Layers" as const,
    title: "14 TCGs Suportados",
    description:
      "Do Commander ao competitivo YGO — uma única plataforma para juízes e jogadores multiformato.",
  },
  {
    icon: "Trophy" as const,
    title: "Torneios sem Fricção",
    description:
      "Pairing, bracket e cronômetro integrados para lojas e organizadores que exigem precisão.",
  },
  {
    icon: "BookOpen" as const,
    title: "Fontes Oficiais",
    description:
      "Cada resposta referencia regras verificáveis — transparência que juízes de head judge exigem.",
  },
  {
    icon: "Cloud" as const,
    title: "Histórico na Nuvem",
    description:
      "Consultas sincronizadas com sua conta — retome partidas, exporte relatórios, audite decisões.",
  },
  {
    icon: "Globe" as const,
    title: "Comunidade Global",
    description:
      "Juízes, jogadores e LGS conectados num ecossistema construído para o competitivo sério.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Como juiz de YCS, o Judge TCG reduziu meu tempo de consulta em 70%. A citação de fontes mudou o jogo na mesa.",
    name: "Rafael Mendes",
    title: "Head Judge · Yu-Gi-Oh!",
    initials: "RM",
  },
  {
    quote:
      "Nossa loja roda torneios semanais. O bracket e o histórico de rulings deram credibilidade que os jogadores notam.",
    name: "Ana Costa",
    title: "Proprietária · LGS Porto Alegre",
    initials: "AC",
  },
  {
    quote:
      "Finalmente uma ferramenta que parece feita para quem leva o competitivo a sério — não é brinquedo, é infraestrutura.",
    name: "Lucas Ferreira",
    title: "Pro Player · Magic Regional",
    initials: "LF",
  },
] as const;

export const PRICING_PLANS = [
  {
    id: "free",
    name: "Iniciante",
    price: "Grátis",
    period: "",
    description: "Para conhecer a mesa e resolver dúvidas casuais.",
    features: ["50 consultas/dia", "5 TCGs principais", "Histórico local", "Suporte comunitário"],
    cta: "Começar",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Competitivo",
    price: "R$ 29",
    period: "/mês",
    description: "Para jogadores e juízes que precisam de volume e precisão.",
    features: [
      "Consultas ilimitadas",
      "14 TCGs completos",
      "Histórico na nuvem",
      "Export PDF",
      "Prioridade no suporte",
    ],
    cta: "Assinar Pro",
    highlighted: true,
    badge: "Mais Popular",
  },
  {
    id: "team",
    name: "Loja / Organizador",
    price: "Sob consulta",
    period: "",
    description: "Para LGS, federações e eventos com múltiplos juízes.",
    features: [
      "Assentos ilimitados",
      "Torneios & POS",
      "Analytics de evento",
      "Onboarding dedicado",
      "SLA empresarial",
    ],
    cta: "Falar com Vendas",
    highlighted: false,
  },
] as const;
