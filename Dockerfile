# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build ----------
FROM node:22-alpine3.22 AS builder

# Pin npm to a specific version (reproducible) and install without scripts.
ARG NPM_VERSION=10.9.2
RUN npm install -g npm@${NPM_VERSION} --ignore-scripts \
 && npm cache clean --force

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY yarn.lock ./

# Force-resolve vulnerable transitive deps.
RUN <<'EOF' node
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json'));
const fix = {
  'tar': '^7.5.19',
  'glob': '^11.1.0',
  'minimatch': '^10.2.3',
  'brace-expansion': '^5.0.9',
  'picomatch': '^4.0.4',
  'ip-address': '^10.3.1',
  'sigstore': '^4.1.1',
};
const direct = { ...p.dependencies, ...p.devDependencies };
p.overrides = p.overrides || {};
for (const [name, want] of Object.entries(fix)) {
  if (direct[name]) {
    p.overrides[name] = '$' + name;
    console.log(`self-ref ${name} (direct: ${direct[name]}, fix line: ${want})`);
  } else {
    p.overrides[name] = want;
  }
}
fs.writeFileSync('package.json', JSON.stringify(p, null, 2));
EOF

# Install dependencies WITHOUT running lifecycle scripts.
# This blocks arbitrary code execution from transitive deps (postinstall, etc.).
RUN npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund \
 && npm cache clean --force

# Copy source code and configuration files (ONLY what's needed for build)
COPY index.html ./
COPY vite.config.js ./
COPY eslint.config.js ./
COPY public/ ./public/
COPY src/ ./src/

# Re-enable scripts ONLY for packages you trust and that truly need them.
# esbuild ships prebuilt binaries in its tarball for Alpine, but its
# postinstall is normally a no-op install check. Keep this list minimal.
# Adjust/remove based on your actual dependency tree (e.g. sharp, node-gyp).
RUN npm rebuild esbuild --foreground-scripts

# Run build
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

USER root
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

RUN mkdir -p /etc/nginx/conf.d

# Create nginx configuration with security headers
RUN echo 'server { \
    listen 8080; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    add_header Referrer-Policy "strict-origin-when-cross-origin" always; \
    \
    # Enable gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
    \
    # Handle all routes - SPA routing \
    location / { \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
    } \
    \
    # Cache static assets \
    location /static/ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
        try_files $uri =404; \
    } \
    \
    # Cache JS/CSS files \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
        try_files $uri =404; \
    } \
    \
    # Health check \
    location /health { \
        access_log off; \
        return 200 "healthy\n"; \
        add_header Content-Type text/plain; \
    } \
    \
    # Error handling \
    error_page 404 /index.html; \
}' > /etc/nginx/conf.d/default.conf

USER 101

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]