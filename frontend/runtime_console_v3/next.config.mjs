/** @type {import('next').NextConfig} */
/** Proxy: rewrites (edge). Em dev usa API_PROXY_TARGET ou localhost. */
const apiUrl = process.env.API_PROXY_TARGET || "https://seekguidance.onrender.com";

const isDev = process.env.NODE_ENV === "development";

/** Produção: CSP restrito. Dev: unsafe-eval + ws para Next HMR (sem isto, EvalError no browser). */
const cspProduction =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: https://*.supabase.co wss://*.supabase.co; frame-src https://accounts.google.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'";

const cspDevelopment =
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' http://127.0.0.1:8000 http://localhost:8000 https: wss: ws://localhost:3000 ws://127.0.0.1:3000 https://*.supabase.co wss://*.supabase.co; frame-src 'self' https://accounts.google.com https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; object-src 'none'";

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

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Monorepo: evita warning de lockfile na raiz do tcg-judge
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
