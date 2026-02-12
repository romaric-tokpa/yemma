#!/bin/bash
# ============================================
# YEMMA - Configuration initiale du VPS
# ============================================
# À exécuter UNE SEULE FOIS sur un nouveau VPS
# Usage: ssh root@votre-vps 'bash -s' < scripts/setup-vps.sh
# ============================================

set -e

echo "=== Configuration du VPS pour Yemma ==="

# ============================================
# 1. MISE À JOUR DU SYSTÈME
# ============================================
echo "[1/6] Mise à jour du système..."
apt-get update && apt-get upgrade -y

# ============================================
# 2. INSTALLATION DE DOCKER
# ============================================
echo "[2/6] Installation de Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo "Docker déjà installé"
fi

# ============================================
# 3. INSTALLATION DE DOCKER COMPOSE
# ============================================
echo "[3/6] Installation de Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    apt-get install -y docker-compose-plugin
    # Créer un alias pour docker-compose
    ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose 2>/dev/null || true
else
    echo "Docker Compose déjà installé"
fi

# ============================================
# 4. CRÉATION DU RÉSEAU DOCKER
# ============================================
echo "[4/6] Création du réseau Docker..."
docker network create yemma-network 2>/dev/null || echo "Réseau yemma-network existe déjà"

# ============================================
# 5. CONFIGURATION DE TRAEFIK
# ============================================
echo "[5/6] Configuration de Traefik..."
mkdir -p /opt/traefik
mkdir -p /opt/traefik/letsencrypt

# Créer le fichier de configuration Traefik
cat > /opt/traefik/docker-compose.yml << 'EOF'
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /opt/traefik/traefik.yml:/traefik.yml:ro
      - /opt/traefik/letsencrypt:/letsencrypt
    networks:
      - yemma-network
    labels:
      - "traefik.enable=true"
      # Dashboard (optionnel, à sécuriser en production)
      - "traefik.http.routers.traefik.rule=Host(`traefik.yemma-solutions.com`)"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.tls.certresolver=myresolver"
      - "traefik.http.routers.traefik.service=api@internal"

networks:
  yemma-network:
    external: true
EOF

# Créer la configuration Traefik
cat > /opt/traefik/traefik.yml << 'EOF'
api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: yemma-network

certificatesResolvers:
  myresolver:
    acme:
      email: r.tokpa@yemma-solutions.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

log:
  level: INFO

accessLog: {}
EOF

# Démarrer Traefik
cd /opt/traefik
docker-compose up -d

# ============================================
# 6. CRÉATION DU RÉPERTOIRE YEMMA
# ============================================
echo "[6/6] Préparation du répertoire Yemma..."
mkdir -p /opt/yemma

# ============================================
# FIN
# ============================================
echo ""
echo "=== Configuration terminée! ==="
echo ""
echo "Versions installées:"
docker --version
docker-compose --version
echo ""
echo "Services en cours d'exécution:"
docker ps
echo ""
echo "Prochaines étapes:"
echo "1. Configurez le fichier .env.production avec vos secrets"
echo "2. Exécutez le script de déploiement: ./scripts/deploy.sh"
echo ""
