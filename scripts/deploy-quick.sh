#!/bin/bash
# ============================================
# YEMMA - Déploiement rapide (rsync)
# ============================================
# Pour les mises à jour après le déploiement initial
# Usage: ./scripts/deploy-quick.sh
# ============================================

set -e

# ============================================
# CONFIGURATION - MODIFIER CES VALEURS
# ============================================
VPS_HOST="185.158.107.173"
VPS_USER="root"
VPS_PATH="/opt/yemma"
SSH_KEY=""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }

# ============================================
# DÉPLOIEMENT
# ============================================
log_info "Synchronisation des fichiers avec rsync..."

# Construire la commande SSH
SSH_OPTS=""
if [ -n "$SSH_KEY" ] && [ -f "$SSH_KEY" ]; then
    SSH_OPTS="-i $SSH_KEY"
fi

rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.pytest_cache' \
    --exclude='htmlcov' \
    --exclude='.coverage' \
    --exclude='*.log' \
    --exclude='.env' \
    --exclude='docker-compose.dev.yml' \
    -e "ssh $SSH_OPTS" \
    ./ $VPS_USER@$VPS_HOST:$VPS_PATH/

log_success "Fichiers synchronisés"

log_info "Reconstruction et redémarrage des services..."

ssh $SSH_OPTS $VPS_USER@$VPS_HOST << REMOTE
cd $VPS_PATH

# Copier .env.production vers .env
cp .env.production .env

# Reconstruire uniquement les services modifiés
docker-compose build

# Redémarrer les services
docker-compose up -d

# Afficher le statut
docker-compose ps
REMOTE

log_success "Déploiement terminé!"
echo ""
echo "Site: https://yemma-solutions.com"
