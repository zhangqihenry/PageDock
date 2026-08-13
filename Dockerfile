# ---- Builder: install all workspaces (incl. dev deps) and build the Vue frontend ----
FROM node:24-alpine AS builder
WORKDIR /app

# Manifests only first, so this layer only re-runs when dependencies change,
# not on every frontend source edit.
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
RUN npm ci

COPY frontend ./frontend
RUN npm run build

# ---- Runtime: production Node deps + the built frontend + server source ----
FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force \
    && apk add --no-cache su-exec

COPY --chown=node:node src ./src
COPY --from=builder --chown=node:node /app/frontend/dist ./frontend/dist
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p /data \
    && chown -R node:node /app /data \
    && chmod -R u=rwX,go=rX /app \
    && chmod 0755 /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const port=process.env.PORT||3000;fetch('http://127.0.0.1:'+port+'/_pagedock/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
