export type PricingPlanId = "free" | "pro" | "team";

export type PricingFeature = {
  text: string;
  included: boolean;
  highlight?: boolean;
};

export type PricingPlan = {
  id: PricingPlanId;
  name: string;
  subtitle: string;
  iconName: "zap" | "crown" | "users";
  priceMonthly: number;
  priceAnnual: number;
  features: PricingFeature[];
  cta: string;
  ctaAction: string;
  popular?: boolean;
  color: string;
  glowColor: string;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Casual",
    subtitle: "Para conhecer a mesa e resolver dúvidas casuais",
    iconName: "zap",
    priceMonthly: 0,
    priceAnnual: 0,
    features: [
      { text: "50 perguntas/dia", included: true },
      { text: "5 jogos (MTG, PKM, YGO, LOR, OP)", included: true },
      { text: "Vereditos com fontes", included: true },
      { text: "Histórico local (10 consultas)", included: true },
      { text: "1 torneio/mês", included: true },
      { text: "Modo torneio completo", included: false },
      { text: "Exportar vereditos", included: false },
      { text: "API access", included: false },
      { text: "Suporte prioritário", included: false },
    ],
    cta: "Começar Grátis",
    ctaAction: "/judge",
    color: "#22c55e",
    glowColor: "rgba(34, 197, 94, 0.2)",
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "Para jogadores e juízes que precisam de volume e precisão",
    iconName: "crown",
    priceMonthly: 29,
    priceAnnual: 290,
    features: [
      { text: "Perguntas ilimitadas", included: true, highlight: true },
      { text: "Todos os 14 jogos", included: true, highlight: true },
      { text: "Histórico cloud ilimitado", included: true },
      { text: "Favoritos e coleções", included: true },
      { text: "Modo Juiz de Torneio", included: true, highlight: true },
      { text: "Exportar vereditos (PDF/QR)", included: true },
      { text: "Sem anúncios", included: true },
      { text: "API access (1K req/dia)", included: false },
      { text: "Suporte prioritário", included: true },
    ],
    cta: "Assinar Pro",
    ctaAction: "#checkout-pro",
    popular: true,
    color: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.3)",
  },
  {
    id: "team",
    name: "LGS",
    subtitle: "Para lojas que levam o competitivo a sério",
    iconName: "users",
    priceMonthly: 199,
    priceAnnual: 1990,
    features: [
      { text: "Torneios ilimitados", included: true, highlight: true },
      { text: "Bracket & pairing automático", included: true, highlight: true },
      { text: "Múltiplos juízes na mesa", included: true },
      { text: "Analytics de evento", included: true },
      { text: "Tudo do Pro", included: true },
      { text: "Onboarding dedicado", included: true },
      { text: "Suporte prioritário", included: true },
      { text: "SLA empresarial", included: true },
    ],
    cta: "Calcular para minha loja",
    ctaAction: "mailto:contato@judgetcg.com.br?subject=Plano%20LGS",
    color: "#8b5cf6",
    glowColor: "rgba(139, 92, 246, 0.2)",
  },
];

export type ComparisonRow = {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  team: string | boolean;
};

export const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Perguntas por dia", free: "50", pro: "Ilimitadas", team: "Ilimitadas" },
  { feature: "Jogos suportados", free: "5", pro: "14", team: "14" },
  { feature: "Histórico", free: "Local (10)", pro: "Cloud ∞", team: "Cloud ∞" },
  { feature: "Torneios criados/mês", free: "1", pro: "Ilimitados", team: "Ilimitados" },
  { feature: "Modo torneio", free: "Participar", pro: true, team: true },
  { feature: "Exportar PDF/QR", free: false, pro: true, team: true },
  { feature: "Usuários", free: "1", pro: "1", team: "Até 5" },
  { feature: "API", free: false, pro: "1K/dia", team: "10K/dia" },
  { feature: "White-label", free: false, pro: false, team: true },
  { feature: "Suporte", free: "Comunidade", pro: "Prioritário", team: "24/7" },
];

export const PRICING_FAQS = [
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem taxa de cancelamento. Como um mulligan gratuito.",
  },
  {
    q: "O que acontece com meus dados se eu cancelar?",
    a: "Seus dados permanecem seguros. No Free você mantém histórico local; no Pro, o histórico na nuvem fica acessível até o fim do período pago.",
  },
  {
    q: "Tem garantia?",
    a: "Sim — 7 dias de garantia. Cancele quando quiser, sem taxas escondidas.",
  },
  {
    q: "O que acontece se eu exceder 50 perguntas no free?",
    a: "Você entra na fase de 'esperar até amanhã' ou faz upgrade para PRO.",
  },
  {
    q: "Posso trocar de plano?",
    a: "Sim, upgrade ou downgrade a qualquer momento.",
  },
  {
    q: "O pagamento é seguro?",
    a: "Sim, usamos Stripe — o mesmo que Amazon e Uber. Seus dados de cartão nunca tocam nossos servidores.",
  },
  {
    q: "Tem desconto para LGS?",
    a: "Sim — fale com a equipe pelo plano LGS para calcular o melhor fit para sua loja.",
  },
  {
    q: "Funciona offline?",
    a: "Não — precisamos consultar nossa base de regras. Estamos trabalhando em cache avançado.",
  },
  {
    q: "Posso usar em torneios oficiais?",
    a: "O modo Juiz de Torneio do PRO é projetado para isso. Consulte sua organização.",
  },
];
