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

# Copy only built output
COPY --from=builder /app/.output ./

EXPOSE 3000

CMD ["node", "server/index.mjs"]
