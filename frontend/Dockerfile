# Étape 1 : Build de l'application React
FROM node:18-alpine AS builder
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code source
COPY . .

# Construire l'application (crée le dossier /app/dist)
RUN npm run build

# Étape 2 : Serveur Nginx pour servir les fichiers
# On ajoute "AS production" car c'est ce que cherche le docker-compose.yml
FROM nginx:alpine AS production

# Copier les fichiers buildés depuis l'étape précédente
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
