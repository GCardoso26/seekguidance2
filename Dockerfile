# Checkout BC V2 (Node) — default Docker entry for Render when Dockerfile Path = Dockerfile
# Prefer explicit path: services/api/Dockerfile.checkout-v2
# Build context: monorepo root
FROM node:20-slim AS build
WORKDIR /app
COPY services/api/package.json services/api/package-lock.json* ./
RUN npm install --omit=dev=false
COPY services/api/tsconfig.json services/api/vitest.config.ts ./
COPY services/api/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV CHECKOUT_V2_FORCE=1
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 10000
CMD ["node", "dist/workers/checkout-v2-api.js"]
