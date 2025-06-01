FROM node:20.12.2-alpine3.18 as base

WORKDIR /app

# Production stage
FROM base
ENV NODE_ENV=production
WORKDIR /app

# Copy the environment file
COPY .env.production /app/.env
COPY build /app/
RUN yarn

EXPOSE 3333

CMD ["node", "./bin/server.js"]
