# Build web static assets
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY web/package.json web/package-lock.json* ./
RUN npm install
COPY web/ ./
ARG VITE_CWM_API_BASE=http://127.0.0.1:8787
ENV VITE_CWM_API_BASE=$VITE_CWM_API_BASE
RUN npm run build

# Serve with nginx
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
