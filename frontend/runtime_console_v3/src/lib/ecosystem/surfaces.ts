/**
 * Ecossistema JudgeTCG — arquitetura de extensibilidade (Epic 20).
 * Sem parceiros específicos; apenas contratos e pontos de extensão.
 */

export const ECOSYSTEM_CAPABILITIES = [
  "import",
  "export",
  "public_api",
  "sdk",
  "partners",
  "mobile_apps",
  "store_tools",
  "tournament_tools",
  "content_creators",
  "public_widgets",
  "deep_links",
  "future_integrations",
] as const;

export type EcosystemCapability = (typeof ECOSYSTEM_CAPABILITIES)[number];

export type EcosystemSurface = {
  id: EcosystemCapability;
  title: string;
  entrypoint: string;
  notes: string;
};

export const ECOSYSTEM_SURFACES: EcosystemSurface[] = [
  {
    id: "import",
    title: "Importação",
    entrypoint: "/vendedor/painel/estoque/importacao",
    notes: "CSV / catalog ingest via Product Catalog + Asset Pipeline.",
  },
  {
    id: "export",
    title: "Exportação",
    entrypoint: "/decks",
    notes: "Deck export + collection export hooks existentes.",
  },
  {
    id: "public_api",
    title: "APIs públicas",
    entrypoint: "/vendedor/painel/configuracoes/api",
    notes: "public-api worker + developer keys — ADR-011.",
  },
  {
    id: "sdk",
    title: "SDK",
    entrypoint: "services/api/sdk/python/tcg_runtime",
    notes: "Stub Python SDK — maturity tests.",
  },
  {
    id: "partners",
    title: "Parceiros",
    entrypoint: "/developer",
    notes: "Estrutura apenas — sem parceiro concreto.",
  },
  {
    id: "mobile_apps",
    title: "Apps Mobile",
    entrypoint: "/",
    notes: "PWA + Mobile First V2 + deep links.",
  },
  {
    id: "store_tools",
    title: "Ferramentas para lojas",
    entrypoint: "/vendedor/painel",
    notes: "Seller Experience V2 + Intelligence.",
  },
  {
    id: "tournament_tools",
    title: "Ferramentas para torneios",
    entrypoint: "/search/torneios",
    notes: "Tournament Hub + ops dashboards.",
  },
  {
    id: "content_creators",
    title: "Criadores de conteúdo",
    entrypoint: "/editorial",
    notes: "Editorial Platform + share social.",
  },
  {
    id: "public_widgets",
    title: "Widgets públicos",
    entrypoint: "/marketplace/intelligence",
    notes: "Embed futuro via public-api — contrato reservado.",
  },
  {
    id: "deep_links",
    title: "Deep links",
    entrypoint: "/u/{username}",
    notes: "Portais /cards /sets /decks /search/torneios.",
  },
  {
    id: "future_integrations",
    title: "Integrações futuras",
    entrypoint: "docs/architecture/PUBLIC_API_BOUNDARIES.md",
    notes: "RFC + ADR obrigatórios (ADR-015).",
  },
];
