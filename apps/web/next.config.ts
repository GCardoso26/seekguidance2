import type { NextConfig } from "next";

/**
 * Path-based reverse proxy — not a BFF.
 * Public (:8787) · Auth+Marketplace (:8789) · Cart/Checkout may share auth or CHECKOUT_API_ORIGIN.
 * Local full vertical: `AUTH_API_PORT=8789 npm run api:checkout` (Identity+Marketplace+Order).
 */
const publicOrigin = process.env.PUBLIC_API_ORIGIN ?? "http://127.0.0.1:8787";
const authOrigin = process.env.API_ORIGIN ?? "http://127.0.0.1:8789";
const checkoutOrigin = process.env.CHECKOUT_API_ORIGIN ?? authOrigin;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/v1/search", destination: `${publicOrigin}/api/v1/search` },
      { source: "/api/v1/suggest", destination: `${publicOrigin}/api/v1/suggest` },
      { source: "/api/v1/sets", destination: `${publicOrigin}/api/v1/sets` },
      { source: "/api/v1/sets/:path*", destination: `${publicOrigin}/api/v1/sets/:path*` },
      { source: "/api/v1/cards", destination: `${publicOrigin}/api/v1/cards` },
      { source: "/api/v1/cards/:path*", destination: `${publicOrigin}/api/v1/cards/:path*` },
      { source: "/api/v1/variants", destination: `${publicOrigin}/api/v1/variants` },
      {
        source: "/api/v1/variants/:path*",
        destination: `${publicOrigin}/api/v1/variants/:path*`,
      },
      {
        source: "/api/v1/marketplace/:path*",
        destination: `${authOrigin}/api/v1/marketplace/:path*`,
      },
      { source: "/api/v1/cart", destination: `${checkoutOrigin}/api/v1/cart` },
      { source: "/api/v1/cart/:path*", destination: `${checkoutOrigin}/api/v1/cart/:path*` },
      { source: "/api/v1/checkout", destination: `${checkoutOrigin}/api/v1/checkout` },
      {
        source: "/api/v1/checkout/:path*",
        destination: `${checkoutOrigin}/api/v1/checkout/:path*`,
      },
      { source: "/api/v1/orders", destination: `${checkoutOrigin}/api/v1/orders` },
      { source: "/api/v1/orders/:path*", destination: `${checkoutOrigin}/api/v1/orders/:path*` },
      { source: "/api/v1/:path*", destination: `${authOrigin}/api/v1/:path*` },
    ];
  },
};

export default nextConfig;
