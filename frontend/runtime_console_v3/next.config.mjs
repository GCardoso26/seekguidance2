/** @type {import('next').NextConfig} */
/** Proxy só via app/api/proxy/[...path]/route.ts (runtime). Não usar rewrites aqui — causam loop 508 na Vercel. */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
};

export default nextConfig;
