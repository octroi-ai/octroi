# Octroi proxy (Hono/Bun) — built from the monorepo ROOT context.
# .dockerignore excludes node_modules/.git/.next, so COPY . . is source only.
FROM oven/bun:1 AS builder
WORKDIR /app
COPY . .
RUN bun install
RUN cd apps/proxy && bun build src/index.ts --outdir dist --target bun

FROM oven/bun:1-slim AS runtime
WORKDIR /app
COPY --from=builder /app/apps/proxy/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
USER bun
# Render injects PORT; the proxy honours it (config.ts).
CMD ["bun", "run", "dist/index.js"]
