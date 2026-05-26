/** @type {import('next').NextConfig} */

/** Proxy: rewrites (edge). Em dev usa API_PROXY_TARGET ou localhost. */

const apiUrl =

  process.env.API_PROXY_TARGET || "https://seekguidance.onrender.com";



const nextConfig = {

  reactStrictMode: true,

  output: "standalone",

  async rewrites() {

    const target =

      process.env.NODE_ENV === "development"

        ? process.env.API_PROXY_TARGET || "http://127.0.0.1:8000"

        : apiUrl;

    return [{ source: "/api/proxy/:path*", destination: `${target}/:path*` }];

  },

};



export default nextConfig;


