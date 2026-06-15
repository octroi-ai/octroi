FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/esg-engine/package.json ./packages/esg-engine/
COPY packages/compliance-engine/package.json ./packages/compliance-engine/
COPY apps/proxy/package.json ./apps/proxy/
RUN bun install --frozen-lockfile || bun install

FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN cd apps/proxy && bun build src/index.ts --outdir dist --target bun

FROM oven/bun:1-slim AS runtime
WORKDIR /app
COPY --from=builder /app/apps/proxy/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
USER bun
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s CMD bun -e "fetch('http://localhost:8787/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["bun", "run", "dist/index.js"]
