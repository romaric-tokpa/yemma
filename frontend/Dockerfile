# =============================================================================
# DOCKERFILE pour le frontend Yemma
#
# PRODUCTION: Utilise les fichiers pré-buildés (dist/) pour éviter le build
#             sur Hostinger qui a des ressources très limitées.
#             -> Exécuter "npm run build" localement avant de commiter
#
# DEVELOPMENT: Utilise le dev server Node avec hot reload
# =============================================================================

# =============================================================================
# STAGE: Production (image légère nginx avec fichiers pré-buildés)
# =============================================================================
FROM nginx:alpine AS production

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers pré-buildés (dist/ doit exister - npm run build avant)
# En CI: le workflow exécute "npm run build" avant ce build
COPY dist /usr/share/nginx/html

# Vérifier que index.html existe (évite 404 silencieux)
RUN test -f /usr/share/nginx/html/index.html || (echo "ERREUR: dist/ vide - exécutez npm run build" && exit 1)

# Exposer le port 3000 (pour cohérence avec docker-compose)
EXPOSE 3000

# Nginx écoute sur le port 3000
CMD ["nginx", "-g", "daemon off;"]

# =============================================================================
# STAGE: Development (avec hot reload)
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
