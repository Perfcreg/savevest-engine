FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy built application
COPY --from=build /app/build ./
COPY --from=build /app/package.json ./package.json

# Install production dependencies
RUN if [ -f yarn.lock ]; then yarn install --production --frozen-lockfile && yarn cache clean; \
    elif [ -f package-lock.json ]; then npm ci --only=production && npm cache clean --force; \
    else npm install --only=production && npm cache clean --force; fi

EXPOSE 3333
CMD ["node", "bin/server.js"]
