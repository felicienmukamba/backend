# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package and config files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma/

# Install dependencies (ignoring scripts)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client
RUN DATABASE_URL=mysql://localhost:3306/db npx prisma generate

# Build the application
RUN DATABASE_URL=mysql://localhost:3306/db npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
