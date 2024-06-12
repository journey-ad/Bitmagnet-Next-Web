# Use node:18-alpine as the base image
FROM node:18-alpine AS base

# Set the working directory
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json ./
RUN npm config set registry 'https://registry.npmmirror.com/' && npm install

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Prepare the runner stage
FROM node:18-alpine AS runner

# Set the working directory
WORKDIR /app

# Copy the necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
