# =============================================================================
# MULTI-STAGE DOCKERFILE pour le frontend Yemma
# - Stage 1 (builder): Build de production avec optimisations mémoire
# - Stage 2 (production): Image légère nginx pour servir les fichiers statiques
# - Stage 3 (development): Image Node pour le dev server
# =============================================================================

ARG APP_ENV=development

# =============================================================================
# STAGE 1: Builder (utilisé uniquement pour le build de production)
# =============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copier uniquement les fichiers de dépendances d'abord (cache Docker)
COPY package.json package-lock.json* ./

# Installer les dépendances
# npm install est plus tolérant que npm ci sur les environnements contraints
RUN npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund

# Copier le code source
COPY . .

# Build de production avec optimisations mémoire pour VPS limités
# --max-old-space-size=1024: limite la heap pour éviter OOM sur Hostinger (RAM limitée)
ENV NODE_ENV=production
RUN NODE_OPTIONS="--max-old-space-size=1024" npm run build

# =============================================================================
# STAGE 2: Production (image légère nginx)
# =============================================================================
FROM nginx:alpine AS production

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port 3000 (pour cohérence avec docker-compose)
EXPOSE 3000

# Nginx écoute sur le port 3000
CMD ["nginx", "-g", "daemon off;"]

# =============================================================================
# STAGE 3: Development (avec hot reload)
# =============================================================================
FROM node:18-alpine AS development

WORKDIR /app

ENV APP_ENV=development

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Entrypoint pour le développement (gère le cas des volumes vides)
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 3000

# Dev server avec hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

