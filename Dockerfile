# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 – Install dependencies
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 – Build the application
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next.config.ts sets output: 'standalone'
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 3 – Production runner (minimal image)
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Allow the port to be overridden at runtime (default 3000 internally)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Public assets
COPY --from=builder /app/public ./public

# Standalone server + static chunks
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]