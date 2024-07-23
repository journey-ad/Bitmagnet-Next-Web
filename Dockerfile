# Use node:20-alpine as the base image
FROM node:20-alpine AS base

# Set the working directory
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json ./
RUN npm install

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Prepare the runner stage
FROM node:20-alpine AS runner

# Set the working directory
WORKDIR /app

# Copy the necessary files from the builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/server ./.next/server

# Expose the application port
EXPOSE 3000

# Set environment variables
ENV HOSTNAME=:: PORT=3000

# Start the application
CMD ["node", "server.js"]
