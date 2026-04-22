# Multi-stage Dockerfile for the donation processor. Produces a slim runtime
# image using Next.js standalone output, so reviewers can build and run it
# without any local tooling beyond Docker.
#
#   docker build -t donation-processor .
#   docker run --rm -p 3000:3000 donation-processor
#
# Image size: ~300MB instead of ~800MB because only production deps ship.

# --- deps: install everything needed for the build ---
FROM node:22.15.0-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --ignore-scripts --non-interactive

# --- build: compile Next.js with standalone output ---
FROM node:22.15.0-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build

# --- runtime: only the standalone bundle ships ---
FROM node:22.15.0-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Next's standalone mode already bundles the minimum node_modules it needs.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
