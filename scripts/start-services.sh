#!/bin/bash

# Script pour démarrer les services backend par étapes

set -e

echo "🚀 Démarrage des services Yemma Solutions"
echo "=========================================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Déterminer le fichier docker-compose.yml à utiliser
if [ -f docker-compose.yml ]; then
    COMPOSE_FILE="docker-compose.yml"
elif [ -f docker/docker-compose.yml ]; then
    COMPOSE_FILE="docker/docker-compose.yml"
else
    echo "❌ Aucun fichier docker-compose.yml trouvé"
    exit 1
fi

echo "📄 Utilisation du fichier: $COMPOSE_FILE"

# Vérifier le fichier .env
if [ ! -f .env ]; then
    if [ -f env.example ]; then
        echo "📝 Création du fichier .env..."
        cp env.example .env
        echo -e "${YELLOW}⚠️  N'oubliez pas de modifier les mots de passe dans .env !${NC}"
    else
        echo -e "${YELLOW}⚠️  Le fichier env.example n'existe pas. Créez un fichier .env manuellement.${NC}"
    fi
fi

echo ""
echo "📦 Étape 1/5 : Démarrage de l'infrastructure (PostgreSQL, Redis, MinIO)..."
docker-compose -f $COMPOSE_FILE up -d postgres redis minio
echo -e "${GREEN}✅ Infrastructure démarrée${NC}"
echo "⏳ Attente de 10 secondes pour que les services soient prêts..."
sleep 10

echo ""
echo "📦 Étape 2/5 : Démarrage des services de base (Auth, Candidate)..."
docker-compose -f $COMPOSE_FILE up -d auth candidate
echo -e "${GREEN}✅ Services de base démarrés${NC}"

echo ""
echo "📦 Étape 3/5 : Démarrage d'ElasticSearch et Kibana..."
docker-compose -f $COMPOSE_FILE up -d elasticsearch kibana
echo -e "${GREEN}✅ ElasticSearch et Kibana démarrés${NC}"
echo "⏳ Attente de 30 secondes pour qu'ElasticSearch soit prêt..."
sleep 30

echo ""
echo "📦 Étape 4/5 : Démarrage du service Search..."
docker-compose -f $COMPOSE_FILE up -d search
echo -e "${GREEN}✅ Service Search démarré${NC}"

echo ""
echo "📦 Étape 5/5 : Démarrage des services complémentaires..."
docker-compose -f $COMPOSE_FILE up -d admin document company payment notification audit
echo -e "${GREEN}✅ Services complémentaires démarrés${NC}"

echo ""
echo "📊 État des services :"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo -e "${GREEN}✅ Tous les services sont démarrés !${NC}"
echo ""
echo "📡 URLs d'accès :"
echo "  - Frontend:        http://localhost:3000"
echo "  - Auth API:        http://localhost:8001/docs"
echo "  - Candidate API:   http://localhost:8002/docs"
echo "  - Admin API:       http://localhost:8009/docs"
echo "  - Search API:      http://localhost:8004/docs"
echo "  - Company API:    http://localhost:8005/docs"
echo "  - Payment API:     http://localhost:8006/docs"
echo "  - Notification:   http://localhost:8007/docs"
echo "  - Audit API:      http://localhost:8008/docs"
echo "  - MinIO Console:   http://localhost:9001 (minioadmin/minioadmin123)"
echo "  - Kibana:          http://localhost:5601"
echo "  - ElasticSearch:   http://localhost:9200"
echo ""
echo "📝 Prochaines étapes :"
echo "  1. Vérifier les logs : docker-compose -f $COMPOSE_FILE logs -f"
echo "  2. Exécuter les migrations : make migrate-all"
echo "  3. Initialiser ElasticSearch : docker-compose -f $COMPOSE_FILE exec search python scripts/init_index.py"

