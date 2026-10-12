# Multi-stage Nuxt 3 SSR build for aabenforms.dk
# Stage 1: build
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Install deps first (layer cache)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
ARG API_BASE_URL=https://api.aabenforms.dk
ENV API_BASE_URL=$API_BASE_URL
ARG NUXT_PUBLIC_MITID_ENABLED=false
ENV NUXT_PUBLIC_MITID_ENABLED=$NUXT_PUBLIC_MITID_ENABLED
ARG NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED=false
ENV NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED=$NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED
RUN pnpm run build

# Stage 2: production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# The MitID session routes reach Drupal container-to-container on the shared
# docker network, so Drupal sees the citizen's IP in X-Forwarded-For (#252).
# Read by Nuxt at runtime; override per deployment.
ARG NUXT_API_INTERNAL_BASE=http://aabenforms_drupal
ENV NUXT_API_INTERNAL_BASE=$NUXT_API_INTERNAL_BASE

# Copy only built output
COPY --from=builder /app/.output ./

EXPOSE 3000

CMD ["node", "server/index.mjs"]
