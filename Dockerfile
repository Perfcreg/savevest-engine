FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Clean up dev dependencies
RUN npm prune --production

# Copy and set permissions for startup script
COPY start.sh ./
RUN chmod +x start.sh

# Set production environment
ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0

EXPOSE 3333

# Use startup script
CMD ["./start.sh"]
