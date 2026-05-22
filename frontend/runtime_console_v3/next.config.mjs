/** @type {import('next').NextConfig} */
/** Só servidor: API_PROXY_TARGET na Vercel. Não usar NEXT_PUBLIC_API_URL (vaza URL no bundle). */
const apiUrl =
  process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/proxy/:path*", destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;
