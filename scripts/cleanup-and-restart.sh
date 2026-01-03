#!/bin/bash

# Script pour nettoyer et redémarrer les services

set -e

echo "🧹 Nettoyage et redémarrage des services"
echo "=========================================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Déterminer le fichier docker-compose.yml
if [ -f docker-compose.yml ]; then
    COMPOSE_FILE="docker-compose.yml"
elif [ -f docker/docker-compose.yml ]; then
    COMPOSE_FILE="docker/docker-compose.yml"
else
    echo -e "${RED}❌ Aucun fichier docker-compose.yml trouvé${NC}"
    exit 1
fi

echo ""
echo "1️⃣ Arrêt des conteneurs existants..."
docker-compose -f $COMPOSE_FILE down 2>/dev/null || true

echo ""
echo "2️⃣ Vérification des conteneurs orphelins..."
# Arrêter les conteneurs yemma qui pourraient être en cours
docker ps -a --filter "name=yemma" --format "{{.Names}}" | while read container; do
    if [ ! -z "$container" ]; then
        echo "   Arrêt de $container..."
        docker stop $container 2>/dev/null || true
        docker rm $container 2>/dev/null || true
    fi
done

echo ""
echo "3️⃣ Vérification du port 5432..."
if command -v ss &> /dev/null; then
    if ss -tuln 2>/dev/null | grep -q ":5432 "; then
        echo -e "${YELLOW}⚠️  Le port 5432 est utilisé${NC}"
        echo "   Tentative d'arrêt de PostgreSQL local..."
        sudo systemctl stop postgresql 2>/dev/null || echo "   PostgreSQL local non trouvé"
    else
        echo -e "${GREEN}✅ Port 5432 libre${NC}"
    fi
fi

echo ""
echo "4️⃣ Nettoyage des volumes (optionnel)..."
read -p "Voulez-vous supprimer les volumes de données ? (o/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "   Suppression des volumes..."
    docker-compose -f $COMPOSE_FILE down -v 2>/dev/null || true
else
    echo "   Conservation des volumes"
fi

echo ""
echo "5️⃣ Redémarrage des services..."
docker-compose -f $COMPOSE_FILE up -d

echo ""
echo -e "${GREEN}✅ Nettoyage terminé !${NC}"
echo ""
echo "📊 État des services :"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "📝 Prochaines étapes :"
echo "   - Vérifier les logs : docker-compose -f $COMPOSE_FILE logs -f"
echo "   - Vérifier l'état : docker-compose -f $COMPOSE_FILE ps"

