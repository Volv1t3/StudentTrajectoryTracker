#? Build Stage Configuration
# Installs all dependencies including dev for potential build tasks

FROM node:24-alpine AS builder
WORKDIR /app

## Install system build tools required to compile native modules (bcrypt)
RUN apk add --no-cache python3 make g++ build-base openssl-dev

# copy package files explicitly to ensure package-lock.json is available to `npm ci`
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

#? Production Stage
# Copies only runtime dependencies and source from builder

FROM node:24-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

EXPOSE 34761
CMD ["node", "src/server.js"]
