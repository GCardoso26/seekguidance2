/** @type {import('next').NextConfig} */
/** Proxy: rewrites (edge). Em dev usa API_PROXY_TARGET ou localhost. */
const apiUrl =
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://seekguidance.onrender.com";

const supabaseHost =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "").split("/")[0] ??
  "*.supabase.co";

const isDev = process.env.NODE_ENV === "development";

const cspProduction =
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: https://*.supabase.co wss://*.supabase.co https://api.stripe.com; frame-src https://accounts.google.com https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'";

const cspDevelopment =
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' http://127.0.0.1:8000 http://localhost:8000 https: wss: ws://localhost:3000 ws://127.0.0.1:3000 https://*.supabase.co wss://*.supabase.co https://api.stripe.com; frame-src 'self' https://accounts.google.com https://*.supabase.co https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'";

const securityHeaders = [
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: isDev ? cspDevelopment : cspProduction,
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const marketplaceRedirects = [
  { source: "/catalog/search", destination: "/loja/busca", permanent: true },
  { source: "/catalog/search/:path*", destination: "/loja/busca", permanent: true },
  { source: "/games/:game", destination: "/loja/:game", permanent: true },
  { source: "/cards/:id", destination: "/loja/cartas/:id", permanent: true },
  { source: "/marketplace/checkout", destination: "/checkout", permanent: true },
  { source: "/marketplace/cart", destination: "/carrinho", permanent: true },
  { source: "/player/me", destination: "/perfil", permanent: true },
  { source: "/leaderboard", destination: "/comunidade/leaderboard", permanent: true },
  { source: "/alerts", destination: "/perfil/alertas", permanent: true },
  { source: "/decks/:deckId/edit", destination: "/decks/:deckId/build", permanent: true },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "cards.scryfall.io" },
      { protocol: "https", hostname: "images.pokemontcg.io" },
      { protocol: "https", hostname: "images.ygoprodeck.com" },
      { protocol: "https", hostname: "lorcast.com" },
      { protocol: "https", hostname: "**.optcgapi.com" },
      { protocol: "https", hostname: "**.digimoncard.io" },
      { protocol: "https", hostname: "goagain.dev" },
      { protocol: "https", hostname: "tcg-judge.com" },
      { protocol: "https", hostname: "judgetcg.com.br" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return marketplaceRedirects;
  },
  async rewrites() {
    const target =
      process.env.NODE_ENV === "development"
        ? process.env.API_PROXY_TARGET || "http://127.0.0.1:8000"
        : apiUrl;
    return [{ source: "/api/proxy/:path*", destination: `${target}/:path*` }];
  },
};

export default nextConfig;
