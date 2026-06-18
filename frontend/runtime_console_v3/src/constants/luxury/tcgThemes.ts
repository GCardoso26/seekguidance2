import type { AudienceSegment } from "@/constants/luxury/landingCopy";

export type TcgTheme = {
  id: string;
  name: string;
  short: string;
  accent: string;
  accentMuted: string;
  featured?: boolean;
  description?: string;
};

export const TCG_THEMES: TcgTheme[] = [
  { id: "yugioh", name: "Yu-Gi-Oh!", short: "YGO", accent: "#ef4444", accentMuted: "#7f1d1d", featured: true, description: "YCS, Regionals e Store Champs" },
  { id: "magic", name: "Magic: The Gathering", short: "MTG", accent: "#3b82f6", accentMuted: "#1e3a5f", featured: true, description: "Commander ao competitivo" },
  { id: "pokemon", name: "Pokémon TCG", short: "PKM", accent: "#facc15", accentMuted: "#713f12", featured: true, description: "Regionals e League Cups" },
  { id: "lorcana", name: "Disney Lorcana", short: "LOR", accent: "#a78bfa", accentMuted: "#4c1d95", description: "Set Championship e locals" },
  { id: "one_piece", name: "One Piece", short: "OP", accent: "#f97316", accentMuted: "#7c2d12", description: "Flagship e store events" },
  { id: "fab", name: "Flesh and Blood", short: "FAB", accent: "#dc2626", accentMuted: "#450a0a", description: "Calling e Pro Quest" },
  { id: "digimon", name: "Digimon", short: "DGM", accent: "#06b6d4", accentMuted: "#164e63" },
  { id: "dragon_ball", name: "Dragon Ball", short: "DBS", accent: "#f59e0b", accentMuted: "#78350f" },
  { id: "force_of_will", name: "Force of Will", short: "FoW", accent: "#6366f1", accentMuted: "#312e81" },
  { id: "grand_archive", name: "Grand Archive", short: "GA", accent: "#14b8a6", accentMuted: "#134e4a" },
  { id: "swu", name: "Star Wars Unlimited", short: "SWU", accent: "#64748b", accentMuted: "#1e293b" },
  { id: "riftbound", name: "Riftbound", short: "RFT", accent: "#ec4899", accentMuted: "#831843" },
  { id: "weiss", name: "Weiss Schwarz", short: "WS", accent: "#f472b6", accentMuted: "#831843" },
  { id: "vanguard", name: "Cardfight!! Vanguard", short: "CFV", accent: "#22d3ee", accentMuted: "#155e75" },
];

export const FEATURED_TCG_IDS = ["yugioh", "magic", "pokemon"] as const;

export const FEATURES = [
  {
    icon: "Zap" as const,
    title: "Ruling com fonte. Sem appeal.",
    description:
      "Sua dúvida em segundos — com documento oficial citado para mostrar ao oponente ou ao floor judge.",
    segments: ["home", "player", "judge"] as AudienceSegment[],
  },
  {
    icon: "Layers" as const,
    title: "Do Commander ao YGO — uma mesa só.",
    description:
      "14 TCGs numa única plataforma. Sem trocar de app entre formatos.",
    segments: ["home", "player"] as AudienceSegment[],
  },
  {
    icon: "Trophy" as const,
    title: "Seu torneio não atrasa.",
    description:
      "Pairing automático, bracket correto e cronômetro — evento que começa e acaba na hora.",
    segments: ["home", "lgs"] as AudienceSegment[],
  },
  {
    icon: "BookOpen" as const,
    title: "Cite a regra. Proteja-se.",
    description:
      "Policy, MTR, IPG e CR referenciados — consistência que head judges exigem no salão.",
    segments: ["home", "judge"] as AudienceSegment[],
  },
  {
    icon: "Cloud" as const,
    title: "Suas rulings, sempre à mão.",
    description:
      "Histórico na nuvem — retome consultas, exporte relatórios, audite decisões do evento.",
    segments: ["home", "player", "judge"] as AudienceSegment[],
  },
  {
    icon: "Globe" as const,
    title: "Juízes que trocam experiência.",
    description:
      "Floor judges, head judges e LGS conectados num ecossistema construído para o competitivo sério.",
    segments: ["home", "judge", "lgs"] as AudienceSegment[],
  },
] as const;

export type Testimonial = {
  quote: string;
  name: string;
  title: string;
  initials: string;
  segment: Exclude<AudienceSegment, "home">;
  credential?: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Usei 3x na mesa no top 32. Ganhei tempo no clock e confiança nas jogadas. Mostrei a fonte ao juiz — ele confirmou. Game 2.",
    name: "Ana Beatriz",
    title: "Top 32 YCS Rio 2023",
    initials: "AB",
    segment: "player",
    credential: "@anaygo",
  },
  {
    quote:
      "Zero appeal por inconsistência no evento inteiro. Meus floor judges usaram a mesa para confirmar rulings raras.",
    name: "Carlos Silva",
    title: "Head Judge YCS São Paulo 2024",
    initials: "CS",
    segment: "judge",
    credential: "L3 KDE",
  },
  {
    quote:
      "De 12 para 36 jogadores em 8 meses. A credibilidade do torneio mudou a percepção da loja.",
    name: "Roberto Tanaka",
    title: "LGS Dragão Cards, Curitiba",
    initials: "RT",
    segment: "lgs",
    credential: "Proprietário",
  },
];

export const PRICING_PLANS = [
  {
    id: "free",
    name: "Casual",
    price: "Grátis",
    period: "",
    description: "Para conhecer a mesa e resolver dúvidas casuais.",
    features: ["50 consultas/dia", "5 TCGs principais", "Histórico local", "Suporte comunitário"],
    cta: "Começar",
    highlighted: false,
    segments: ["home", "player"] as AudienceSegment[],
  },
  {
    id: "pro",
    name: "Pro",
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
    segments: ["home", "player", "judge"] as AudienceSegment[],
  },
  {
    id: "lgs",
    name: "LGS",
    price: "A partir de R$ 199",
    period: "/mês",
    description: "Para lojas que levam o competitivo a sério.",
    features: [
      "Torneios ilimitados",
      "Bracket & pairing automático",
      "Múltiplos juízes na mesa",
      "Analytics de evento",
      "Suporte prioritário",
    ],
    cta: "Calcular para minha loja",
    highlighted: false,
    segments: ["home", "lgs"] as AudienceSegment[],
  },
] as const;

export function featuresForSegment(segment: AudienceSegment) {
  if (segment === "home") return FEATURES;
  return FEATURES.filter((f) => f.segments.includes(segment));
}

export function testimonialsForSegment(segment: AudienceSegment) {
  if (segment === "home") return TESTIMONIALS;
  return TESTIMONIALS.filter((t) => t.segment === segment);
}

export function pricingForSegment(segment: AudienceSegment) {
  if (segment === "home") return PRICING_PLANS;
  return PRICING_PLANS.filter((p) => p.segments.includes(segment));
}
