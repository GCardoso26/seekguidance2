import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
/** Proxy: rewrites (edge). Em dev usa API_PROXY_TARGET ou localhost. */
const apiUrl =
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://seekguidance.onrender.com";

const supabaseHostRaw = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "").split("/")[0];
const supabaseHost = supabaseHostRaw && supabaseHostRaw.length > 0 ? supabaseHostRaw : "*.supabase.co";

const isDev = process.env.NODE_ENV === "development";

const cspProduction =
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https: https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://cloudflareinsights.com; frame-src https://accounts.google.com https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'";

// Dev-only allowance so impeccable live mode can load (localhost:8400).
const __impeccableLiveDev =
  process.env.NODE_ENV === "development" ? " http://localhost:8400" : "";

const cspDevelopment =
  `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://static.cloudflareinsights.com${__impeccableLiveDev}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' http://127.0.0.1:8000 http://localhost:8000 https: wss: ws://localhost:3000 ws://127.0.0.1:3000 https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://cloudflareinsights.com${__impeccableLiveDev}; frame-src 'self' https://accounts.google.com https://*.supabase.co https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'`;

const securityHeaders = [
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Content-Security-Policy",
    value: isDev ? cspDevelopment : cspProduction,
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const marketplaceRedirects = [
  // Customer Conversion First: /search era torneios e capturava queries de compra (ex. Rapunzel).
  // Torneios ficam em /search/torneios; compra em /loja/busca (query string preservada).
  { source: "/search", destination: "/loja/busca", permanent: true },
  { source: "/catalog/search", destination: "/loja/busca", permanent: true },
  { source: "/catalog/search/:path*", destination: "/loja/busca", permanent: true },
  { source: "/marketplace", destination: "/loja?from=marketplace", permanent: false },
  { source: "/games/:game", destination: "/:game", permanent: true },
  { source: "/loja/:game/busca", destination: "/:game/cards", permanent: false },
  { source: "/loja/:game/cartas/:id", destination: "/:game/cards/:id", permanent: true },
  { source: "/cards/:id", destination: "/loja/cartas/:id", permanent: true },
  { source: "/marketplace/checkout", destination: "/checkout", permanent: true },
  { source: "/marketplace/checkout/:path*", destination: "/checkout/:path*", permanent: true },
  { source: "/marketplace/cart", destination: "/carrinho", permanent: true },

  // Fechar sub-árvore /marketplace/* (específicos antes do catch-all)
  { source: "/marketplace/produtos", destination: "/loja/selados", permanent: true },
  { source: "/marketplace/produtos/:path*", destination: "/loja/selados/:path*", permanent: true },
  { source: "/marketplace/intelligence", destination: "/loja/tendencias", permanent: true },
  { source: "/marketplace/orders", destination: "/perfil/pedidos", permanent: true },
  { source: "/marketplace/orders/:path*", destination: "/perfil/pedidos", permanent: true },
  { source: "/marketplace/loja/:slug", destination: "/loja", permanent: true },
  { source: "/marketplace/product/:id", destination: "/loja/selados", permanent: true },
  { source: "/marketplace/:path*", destination: "/loja", permanent: true },

  { source: "/player/me", destination: "/perfil", permanent: true },
  { source: "/player/me/history", destination: "/perfil/historico", permanent: true },
  { source: "/player/me/badges", destination: "/perfil/conquistas", permanent: true },
  { source: "/player/:handle", destination: "/u/:handle", permanent: true },
  { source: "/leaderboard", destination: "/comunidade/leaderboard", permanent: true },
  { source: "/alerts", destination: "/perfil/alertas", permanent: true },
  { source: "/decks/:deckId/edit", destination: "/decks/:deckId/build", permanent: true },
  { source: "/stores/create", destination: "/vendedor/painel/onboarding", permanent: true },

  // Eventos canônicos em /search/torneios (store events / ingressos)
  { source: "/torneio", destination: "/search/torneios", permanent: true },
  { source: "/torneio/:id", destination: "/search/torneios/:id", permanent: true },

  // Expansão canônica /sets (Epic 6)
  { source: "/:game/expansions/:set", destination: "/:game/sets/:set", permanent: true },

  // === Redirects de vendedor (/store → /vendedor/painel) ===
  { source: "/store", destination: "/vendedor/painel", permanent: true },
  { source: "/store/dashboard", destination: "/vendedor/painel", permanent: true },
  { source: "/store/listings", destination: "/vendedor/painel/listagens", permanent: true },
  { source: "/store/listings/new", destination: "/vendedor/painel/listagens/nova", permanent: true },
  { source: "/store/listings/:id", destination: "/vendedor/painel/listagens/:id", permanent: true },
  { source: "/store/orders", destination: "/vendedor/painel/pedidos", permanent: true },
  { source: "/store/orders/:id", destination: "/vendedor/painel/pedidos?drawer=:id", permanent: false },
  { source: "/store/analytics", destination: "/vendedor/painel/estatisticas", permanent: true },
  { source: "/store/settings", destination: "/vendedor/painel/configuracoes", permanent: true },
  { source: "/store/payments", destination: "/vendedor/painel/configuracoes/pagamentos", permanent: true },
  { source: "/store/shipping", destination: "/vendedor/painel/configuracoes/frete", permanent: true },
  { source: "/store/cupons", destination: "/vendedor/painel/cupons", permanent: true },
  { source: "/store/pro", destination: "/vendedor/painel/pro", permanent: true },
  { source: "/store/onboarding", destination: "/vendedor/painel/onboarding", permanent: true },
  { source: "/store/:path*", destination: "/vendedor/painel/:path*", permanent: true },

  // === Unificar rotas legadas do painel ===
  { source: "/vendedor/painel/vendas", destination: "/vendedor/painel/pedidos", permanent: true },
  { source: "/vendedor/painel/vendas/:orderId", destination: "/vendedor/painel/pedidos?drawer=:orderId", permanent: false },
  { source: "/vendedor/painel/clientes", destination: "/vendedor/painel/clientes/lista", permanent: true },
];

const nextConfig = {
  reactStrictMode: true,
  /** Required for Lighthouse Best Practices: valid-source-maps on first-party JS. */
  productionBrowserSourceMaps: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@tanstack/react-virtual",
      "sonner",
      "cmdk",
    ],
  },
  /**
   * Belt-and-suspenders: Next 15 + aggressive browserslist can pull next-devtools into
   * production client chunks (~200KiB+ unused JS). Replace with empty modules.
   */
  webpack: (config, { dev, isServer, webpack }) => {
    if (!dev && !isServer) {
      const empty = new URL("./scripts/empty-module.js", import.meta.url).pathname;
      // Windows: URL pathname may start with /S:/ — normalize
      const emptyPath = process.platform === "win32" && empty.startsWith("/") ? empty.slice(1) : empty;
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]next[\\/]dist[\\/].*[\\/]next-devtools[\\/]/,
          emptyPath,
        ),
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]next[\\/].*[\\/]dev-overlay[\\/]/,
          emptyPath,
        ),
      );
    }
    return config;
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/avif", "image/webp"],
    // ResponsiveImage defaults (list=60, hero=78) + common Image quality props must be allowlisted (Next 15).
    qualities: [60, 70, 75, 78, 80, 85, 90, 100],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Keep ≤50 entries (Next.js hard limit). Prefer wildcard hosts over apex duplicates.
      { protocol: "https", hostname: supabaseHost },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.scryfall.io" },
      { protocol: "https", hostname: "images.pokemontcg.io" },
      { protocol: "https", hostname: "images.ygoprodeck.com" },
      { protocol: "https", hostname: "lorcast.com" },
      { protocol: "https", hostname: "**.optcgapi.com" },
      { protocol: "https", hostname: "**.digimoncard.io" },
      { protocol: "https", hostname: "goagain.dev" },
      { protocol: "https", hostname: "assets.tcgdex.net" },
      { protocol: "https", hostname: "judgetcg.com.br" },
      // Cobre cdn.judgetcg.com.br, o CDN próprio de mídia do R2 (ADR-017)
      { protocol: "https", hostname: "**.judgetcg.com.br" },
      { protocol: "https", hostname: "tcg-judge.com" },
      // Lorcana + Ravensburger packshots
      { protocol: "https", hostname: "lorcana-api.com" },
      { protocol: "https", hostname: "**.ravensburger.com" },
      { protocol: "https", hostname: "ravensburger.cloud" },
      { protocol: "https", hostname: "**.ravensburger.cloud" },
      // Other TCG CDNs
      { protocol: "https", hostname: "**.swu-db.com" },
      { protocol: "https", hostname: "cmsassets.rgpub.io" },
      { protocol: "https", hostname: "**.tcggo.com" },
      { protocol: "https", hostname: "**.riftscribe.gg" },
      { protocol: "https", hostname: "**.sorcerytcg.com" },
      { protocol: "https", hostname: "**.curiosa.io" },
      { protocol: "https", hostname: "**.unionarena-tcg.com" },
      { protocol: "https", hostname: "**.apitcg.com" },
      { protocol: "https", hostname: "**.dbs-cardgame.com" },
      { protocol: "https", hostname: "**.justtcg.com" },
      { protocol: "https", hostname: "**.vanguardcard.io" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "tcgplayer-cdn.tcgplayer.com" },
      // Accessory brand CDNs
      { protocol: "https", hostname: "**.shopify.com" },
      { protocol: "https", hostname: "**.tcdn.com.br" },
      { protocol: "https", hostname: "**.ultimateguard.com" },
      { protocol: "https", hostname: "**.asmodee.net" },
      { protocol: "https", hostname: "**.gamegenic.com" },
    ],
  },
  async headers() {
    return [
      // Não aplicar Cache-Control immutable em /_next/static via headers custom —
      // 404 soft (not-found.txt) herdava immutable + text/plain e quebrava chunks
      // com MIME type checking (ex.: /decks/novo). O preset Next/Vercel já cacheia
      // assets hashed com sucesso corretamente.
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      { source: "/:path*", headers: securityHeaders },
    ];
  },
  async redirects() {
    return marketplaceRedirects;
  },
  async rewrites() {
    const target =
      process.env.NODE_ENV === "development"
        ? process.env.API_PROXY_TARGET || "http://127.0.0.1:8000"
        : apiUrl;
    return [
      // Browsers still request /favicon.ico — map to App Router icon route.
      { source: "/favicon.ico", destination: "/icon" },
      { source: "/api/proxy/:path*", destination: `${target}/:path*` },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
