# Build stage — uses ~/projects as build context so we can reach ledger-models
FROM node:21-slim AS builder

# Place the ledger-models tgz where package.json expects it (file:../../../../tmp/...)
# From WORKDIR /app, ../../../../tmp = /tmp
COPY ledger-models/ledger-models-javascript/fintekkers-ledger-models-0.1.125.tgz /tmp/fintekkers-ledger-models-0.1.125.tgz

WORKDIR /app
COPY ui-service/package.json ui-service/package-lock.json ./

# Install all deps (including devDeps needed for build).
# --force is needed because package-lock.json may have a stale integrity hash
# for the local @fintekkers/ledger-models tgz after it was regenerated.
RUN npm install --force

COPY ui-service/ .

# Build the SvelteKit adapter-node production bundle
RUN npm run build

# Runtime stage
FROM node:21-slim

WORKDIR /app

# Copy built output and the production node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

ENV PORT=443
ENV HOST=0.0.0.0
EXPOSE 443

# adapter-node output is started with `node build`
CMD ["node", "build"]
