export type SubscriptionFeatures = {
  deck_builder: boolean;
  basic_analytics: boolean;
  tournament_join: boolean;
  community_support: boolean;
  advanced_analytics: boolean;
  deck_export: boolean;
  tournament_creation: boolean;
  team_management: boolean;
  priority_support: boolean;
  custom_branding: boolean;
  api_access: boolean;
};

export const DEFAULT_FEATURES: SubscriptionFeatures = {
  deck_builder: true,
  basic_analytics: true,
  tournament_join: true,
  community_support: true,
  advanced_analytics: false,
  deck_export: false,
  tournament_creation: false,
  team_management: false,
  priority_support: false,
  custom_branding: false,
  api_access: false,
};

export const FEATURE_LABELS: Record<keyof SubscriptionFeatures, string> = {
  deck_builder: "Deck Builder",
  basic_analytics: "Analytics básicas",
  tournament_join: "Entrar em torneios",
  community_support: "Suporte comunidade",
  advanced_analytics: "Analytics avançadas",
  deck_export: "Export de decks",
  tournament_creation: "Criar torneios",
  team_management: "Gestão de equipa",
  priority_support: "Suporte prioritário",
  custom_branding: "Branding customizado",
  api_access: "Acesso API",
};
