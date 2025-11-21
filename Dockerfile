# Dev-focused Dockerfile for Next.js + Prisma

FROM node:22-bookworm-slim AS base

# Install system dependencies and pnpm
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    bash \
    curl \
    dumb-init \
    tzdata \
    libreoffice \
    fonts-dejavu \
    fonts-liberation \
    fontconfig \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@9

# Set up working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Set development environment variables
ENV NODE_ENV=development \
    WATCHPACK_POLLING=true \
    CHOKIDAR_USEPOLLING=true \
    NEXT_TELEMETRY_DISABLED=1 \
    PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH" \
    TZ=Asia/Manila

# Install dependencies (allow lockfile updates in development)
RUN pnpm install

# Copy prisma schema for client generation
COPY prisma ./prisma/

# Generate Prisma client
RUN pnpm run db:generate

# Copy source code (this will be overridden by bind mount in compose)
COPY . .

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start development server with hot reload
CMD ["sh", "-c", "pnpm run db:generate && pnpm run build && pnpm run start"]


