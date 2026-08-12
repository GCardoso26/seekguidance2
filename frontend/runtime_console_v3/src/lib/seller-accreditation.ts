export type StorePresence = "physical" | "online" | "both";

export type AccreditationAnswers = {
  store?: {
    name?: string;
    cnpj?: string;
    site?: string;
    instagram?: string;
    whatsapp?: string;
    city?: string;
    state?: string;
    presence?: StorePresence;
  };
  cnpj_lookup?: Record<string, unknown>;
  cnpj_confirmed?: boolean;
  responsible?: {
    relation?: string;
    full_name?: string;
    cpf?: string;
    email?: string;
    phone?: string;
  };
  profile?: {
    tcgs?: string[];
    categories?: string[];
    channels?: string[];
  };
  evidence?: {
    site?: string;
    instagram?: string;
    google_business?: string;
    marketplace?: string;
    document_url?: string;
    photos?: string[];
  };
  operations?: {
    sku_band?: string;
    orders_band?: string;
    stock_integrated?: boolean | null;
    sync_method?: string;
  };
  agreements?: Record<string, boolean>;
};

export type AccreditationApplication = {
  id: string;
  protocol?: string | null;
  status: string;
  cnpj?: string | null;
  answers: AccreditationAnswers;
  current_step: number;
  trust_score_initial: number;
  checklist?: Array<{ id: string; label: string; state: string }>;
  awaiting_review?: boolean;
  submitted_at?: string | null;
};

export const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export const TCG_OPTIONS = [
  { id: "LORCANA", label: "Disney Lorcana" },
  { id: "MTG", label: "Magic: The Gathering" },
  { id: "POKEMON", label: "Pokémon" },
  { id: "ONEPIECE", label: "One Piece" },
  { id: "YUGIOH", label: "Yu-Gi-Oh!" },
  { id: "DIGIMON", label: "Digimon" },
  { id: "DBFW", label: "Dragon Ball" },
  { id: "FAB", label: "Flesh and Blood" },
  { id: "RIFTBOUND", label: "Riftbound" },
  { id: "GUNDAM", label: "Gundam" },
  { id: "SORCERY", label: "Sorcery" },
];

export const CATEGORY_OPTIONS = [
  { id: "singles", label: "Singles" },
  { id: "sealed", label: "Produtos selados" },
  { id: "accessories", label: "Acessórios" },
  { id: "decks", label: "Decks" },
  { id: "collectibles", label: "Colecionáveis" },
  { id: "imported", label: "Importados" },
];

export const CHANNEL_OPTIONS = [
  { id: "physical", label: "Loja física" },
  { id: "own_site", label: "Site próprio" },
  { id: "meli", label: "Mercado Livre" },
  { id: "instagram", label: "Instagram" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "other_marketplace", label: "Outro marketplace" },
];

export const RELATION_OPTIONS = [
  { id: "owner", label: "Proprietário" },
  { id: "partner", label: "Sócio" },
  { id: "manager", label: "Gerente" },
  { id: "ecommerce", label: "Responsável pelo e-commerce" },
  { id: "authorized", label: "Funcionário autorizado" },
];

export const SKU_BANDS = [
  { id: "lt100", label: "Até 100" },
  { id: "100_500", label: "100–500" },
  { id: "500_2000", label: "500–2.000" },
  { id: "2000_10000", label: "2.000–10.000" },
  { id: "gt10000", label: "10.000+" },
];

export const ORDERS_BANDS = [
  { id: "0_20", label: "0–20" },
  { id: "20_100", label: "20–100" },
  { id: "100_500", label: "100–500" },
  { id: "gt500", label: "500+" },
];

export const SYNC_METHODS = [
  { id: "api", label: "API" },
  { id: "csv", label: "CSV" },
  { id: "erp", label: "Integração com meu sistema" },
  { id: "manual", label: "Manualmente" },
  { id: "unknown", label: "Ainda não sei" },
];

export const AGREEMENT_KEYS: { id: string; label: string }[] = [
  { id: "stock_updated", label: "Manter informações de estoque atualizadas" },
  { id: "real_prices", label: "Informar preços reais" },
  { id: "ship_as_listed", label: "Enviar produtos conforme anunciado" },
  { id: "condition_policy", label: "Respeitar políticas de condição das cartas" },
  { id: "cancel_return_policy", label: "Cumprir políticas de cancelamento e devolução" },
  { id: "keep_data_updated", label: "Manter dados comerciais atualizados" },
];

export const WIZARD_STEPS = [
  { id: 1, title: "Sua loja" },
  { id: 2, title: "Confirmar CNPJ" },
  { id: 3, title: "Responsável" },
  { id: 4, title: "Perfil" },
  { id: 5, title: "Evidência" },
  { id: 6, title: "Operação" },
  { id: 7, title: "Regras" },
];

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCnpjInput(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatCpfInput(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
