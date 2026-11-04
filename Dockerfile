# Production Dockerfile for Railway / Render / Cloud Run / Tunnel Deployments
FROM node:20-bookworm-slim AS base

# Install build tools for better-sqlite3 and native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build the Next.js application
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Production runner image
FROM node:20-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Default persistent storage locations (can be mounted as volume at /data)
ENV DATABASE_PATH=/data/rise.db
ENV UPLOADS_DIR=/data/uploads

RUN mkdir -p /data/uploads /data && chmod -R 777 /data

COPY --from=base /app/package.json ./
COPY --from=base /app/package-lock.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next
COPY --from=base /app/data ./data

EXPOSE 3000

CMD ["npm", "run", "start"]
