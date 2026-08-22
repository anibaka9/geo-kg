# syntax=docker/dockerfile:1
#
# Two independent build stages (data, assets) share nothing but shared/ and the
# installed devDependencies. Docker's layer cache means editing only web/** skips
# re-running the parser, and editing only data/**/parser/overrides/** skips
# rebuilding assets — see AGENTS.md and DEPLOY.md for the reasoning.

ARG BUN_VERSION=1.4.0

FROM oven/bun:${BUN_VERSION} AS deps
WORKDIR /app
COPY package.json bun.lock ./
# Full install (incl. devDependencies): the data stage needs papaparse/proj4,
# the assets stage needs @tailwindcss/cli — both are devDependencies since
# Phase 0 (they're build-time only, not needed by the running server).
RUN bun install --frozen-lockfile

FROM deps AS data
COPY tsconfig.json ./
COPY shared/ ./shared/
COPY db/ ./db/
COPY parser/ ./parser/
COPY data/ ./data/
RUN bun run parse

FROM deps AS assets
COPY tsconfig.json build.ts ./
COPY shared/ ./shared/
COPY web/ ./web/
RUN bun run build

FROM oven/bun:${BUN_VERSION}-slim AS runtime
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY tsconfig.json server.tsx ./
COPY shared/ ./shared/
COPY db/ ./db/
COPY web/ ./web/
COPY --from=data /app/output/licenses.db ./output/licenses.db
COPY --from=assets /app/public/ ./public/

ENV NODE_ENV=production
ENV DATABASE_PATH=/app/output/licenses.db
EXPOSE 3000
CMD ["bun", "server.tsx"]
