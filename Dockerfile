FROM node:20.12.2-alpine3.18 as base

# All deps stage
FROM base as deps
WORKDIR /app
ADD package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Production only deps stage
FROM base as production-deps
WORKDIR /app
ADD package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Build stage
FROM base as build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD . .
RUN yarn build --ignore-ts-errors

# Production stage
FROM base
ENV NODE_ENV=production
WORKDIR /app

# Copy the environment file
COPY env.production /app/.env

# Copy the production dependencies and build output
COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app

EXPOSE 3333

CMD ["node", "./bin/server.js"]
