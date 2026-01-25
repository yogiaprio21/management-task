# Base image
FROM node:20-alpine AS builder

# Working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built assets and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "run", "start:prod"]
