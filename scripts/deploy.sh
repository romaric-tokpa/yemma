#!/bin/bash
# ============================================
# YEMMA - Script de déploiement Production
# ============================================
# Usage: ./scripts/deploy.sh
#
# Prérequis sur le VPS:
#   - Docker et Docker Compose installés
#   - Traefik configuré et en cours d'exécution
#   - Réseau Docker "yemma-network" créé
# ============================================

set -e  # Arrêter si une commande échoue

# ============================================
# CONFIGURATION - MODIFIER CES VALEURS
# ============================================
VPS_HOST="185.158.107.173"
VPS_USER="root"
VPS_PATH="/opt/yemma"
SSH_KEY=""  # Laisser vide si vous utilisez l'authentification par mot de passe

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# FONCTIONS
# ============================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# VÉRIFICATIONS PRÉLIMINAIRES
# ============================================
log_info "Vérification des prérequis..."

# Vérifier que le fichier .env.production existe
if [ ! -f ".env.production" ]; then
    log_error "Le fichier .env.production n'existe pas!"
    log_info "Créez-le à partir de .env.example et configurez les valeurs de production."
    exit 1
fi

# Vérifier les valeurs par défaut dangereuses dans .env.production
if grep -q "CHANGE_ME" .env.production; then
    log_warning "Le fichier .env.production contient des valeurs 'CHANGE_ME' à modifier!"
    log_warning "Modifiez ces valeurs avant de déployer en production."
    read -p "Continuer quand même? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ============================================
# PRÉPARATION LOCALE
# ============================================
log_info "Préparation du déploiement..."

# Créer une archive des fichiers nécessaires
log_info "Création de l'archive de déploiement..."
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.pytest_cache' \
    --exclude='htmlcov' \
    --exclude='.coverage' \
    --exclude='*.log' \
    --exclude='.env' \
    --exclude='docker-compose.dev.yml' \
    -czvf /tmp/yemma-deploy.tar.gz \
    docker-compose.yml \
    .env.production \
    nginx/ \
    services/ \
    frontend/ \
    docker/

log_success "Archive créée: /tmp/yemma-deploy.tar.gz"

# ============================================
# DÉPLOIEMENT SUR LE VPS
# ============================================
log_info "Connexion au VPS et déploiement..."

# Construire la commande SSH
SSH_CMD="ssh"
SCP_CMD="scp"
if [ -n "$SSH_KEY" ] && [ -f "$SSH_KEY" ]; then
    SSH_CMD="ssh -i $SSH_KEY"
    SCP_CMD="scp -i $SSH_KEY"
fi

# Créer le répertoire sur le VPS
log_info "Création du répertoire de déploiement..."
$SSH_CMD $VPS_USER@$VPS_HOST "mkdir -p $VPS_PATH"

# Copier l'archive sur le VPS
log_info "Transfert des fichiers vers le VPS..."
$SCP_CMD /tmp/yemma-deploy.tar.gz $VPS_USER@$VPS_HOST:$VPS_PATH/

# Extraire et déployer sur le VPS
log_info "Extraction et démarrage des services..."
$SSH_CMD $VPS_USER@$VPS_HOST << 'REMOTE_SCRIPT'
cd /opt/yemma

# Extraire l'archive
tar -xzvf yemma-deploy.tar.gz

# Renommer .env.production en .env
cp .env.production .env

# Créer le réseau Docker s'il n'existe pas
docker network create yemma-network 2>/dev/null || true

# Arrêter les anciens conteneurs
docker-compose down --remove-orphans || true

# Construire et démarrer les services
docker-compose build --no-cache
docker-compose up -d

# Nettoyer
rm -f yemma-deploy.tar.gz

# Afficher le statut
echo ""
echo "=== Statut des conteneurs ==="
docker-compose ps

echo ""
echo "=== Vérification des services ==="
sleep 30  # Attendre le démarrage des services
docker-compose ps
REMOTE_SCRIPT

# ============================================
# VÉRIFICATION
# ============================================
log_info "Vérification du déploiement..."

# Test de santé via curl
if curl -s -o /dev/null -w "%{http_code}" "https://yemma-solutions.com/health" | grep -q "200"; then
    log_success "Le site répond correctement!"
else
    log_warning "Le site ne répond pas encore. Vérifiez les logs sur le VPS."
fi

# ============================================
# NETTOYAGE LOCAL
# ============================================
log_info "Nettoyage..."
rm -f /tmp/yemma-deploy.tar.gz

# ============================================
# FIN
# ============================================
log_success "Déploiement terminé!"
echo ""
echo "=== Prochaines étapes ==="
echo "1. Vérifiez le site: https://yemma-solutions.com"
echo "2. Consultez les logs: ssh $VPS_USER@$VPS_HOST 'cd $VPS_PATH && docker-compose logs -f'"
echo "3. En cas de problème: ssh $VPS_USER@$VPS_HOST 'cd $VPS_PATH && docker-compose logs SERVICE_NAME'"
echo ""
