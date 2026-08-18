# Use official Node as the base image
FROM node:22.18.0-alpine3.22

# Update system packages to fix Alpine vulnerabilities
RUN apk update && apk upgrade --no-cache

# Create custom group and user
RUN addgroup -g 1001 -S tvet-mis && \
    adduser -S tvet-user -u 1001 -G tvet-mis

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first (better layer caching)
COPY package*.json ./

# Install dependencies Without --legacy-peer-deps (Uses strict peer dependency checking)
RUN npm install --legacy-peer-deps

# Copy the rest of the application code with proper ownership
COPY --chown=tvet-user:tvet-mis . .

# Change ownership of the entire app directory
RUN chown -R tvet-user:tvet-mis /app

# Switch to the non-root user
USER tvet-user

# Expose the port the app runs on
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev", "--", "--host"]