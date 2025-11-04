FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0

EXPOSE 3333

CMD ["npm", "start"]
