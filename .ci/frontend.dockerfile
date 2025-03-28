# Stage 1: Build the Angular SSR application
FROM node:20-alpine AS build

WORKDIR /app

# Set build arguments with defaults
ARG APP_ENV=production

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the application with the specified configuration
RUN npx nx build frontend --configuration=${APP_ENV}

# Stage 2: Create a lightweight production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy only the build artifacts from the previous stage
COPY --from=build /app/dist/apps/frontend /app/dist/apps/frontend
COPY --from=build /app/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --legacy-peer-deps

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose the port
EXPOSE ${PORT}

# Run the server
CMD ["node", "dist/apps/frontend/server/server.mjs"]
