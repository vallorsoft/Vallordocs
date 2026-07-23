# ============================================================
# Vallordocs – production Docker image (PRD 6. fejezet – Docker)
#
# Multi-stage build; standalone Next.js output keeps the final
# image to a minimum.  Single container serves UI + API + workers.
# ============================================================

# Stage 1: install dependencies
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: build the Next.js application
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate the Prisma client (required at build time for type-safety).
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: minimal production image
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Public assets
COPY --from=builder /app/public ./public

# Standalone output bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma migration files and schema for runtime migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME="0.0.0.0"

EXPOSE 8080

# Start the server. Run pending migrations first, but never let a migration
# problem (e.g. DATABASE_URL not yet configured, or the database being briefly
# unreachable) stop the machine from booting — otherwise the health check never
# passes and Fly.io reports "no machine created". The server itself does not
# require the database at boot; DB-backed features come online once the
# DATABASE_URL secret is set.
CMD ["sh", "-c", "npx prisma migrate deploy || echo 'WARN: prisma migrate deploy skipped (DATABASE_URL unset or database unreachable) - starting server anyway'; node server.js"]
