# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build ----------
FROM node:22-alpine3.22 AS builder

# Patch the bundled npm CLI (source of the tar/glob/minimatch/brace-expansion CVEs)
RUN npm install -g npm@latest && npm cache clean --force

WORKDIR /app

COPY package*.json ./

# Force-resolve vulnerable transitive deps.
# Packages that are ALSO direct dependencies get a self-reference ($name),
# because npm rejects a hard override on a direct dep (EOVERRIDE).
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

RUN npm install --legacy-peer-deps && npm cache clean --force

COPY . .
RUN npm run build

# ---------- Stage 2: runtime (no npm, no node, no node_modules) ----------
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

USER root
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*
USER 101

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]