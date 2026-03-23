# Build stage
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install root dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy source and build
COPY . .
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy server
COPY --from=build /app/server ./server

# Install server dependencies
WORKDIR /app/server
RUN npm install --production

WORKDIR /app

# Create data directory
RUN mkdir -p /data

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/index.js"]
