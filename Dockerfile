# Multi-stage build for AdonisJS
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM base AS build
COPY . .
RUN yarn build

FROM node:20-alpine AS production
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile && yarn cache clean
COPY --from=build /app/build ./build
COPY --from=build /app/ace ./ace
COPY --from=build /app/adonisrc.ts ./adonisrc.ts

EXPOSE 3333
CMD ["node", "ace", "serve", "--watch"]