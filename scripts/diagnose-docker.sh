#!/bin/bash

# Script de diagnostic pour Docker Compose
# Usage: ./scripts/diagnose-docker.sh

set -e

echo "🔍 Diagnostic Docker Compose - Yemma Solutions"
echo "=============================================="
echo ""

# Vérifier si Docker est en cours d'exécution
echo "1. Vérification de Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution"
    echo "   Veuillez démarrer Docker Desktop"
    exit 1
fi
echo "✅ Docker est en cours d'exécution"
echo ""

# Vérifier si docker-compose est disponible
echo "2. Vérification de docker-compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose n'est pas installé"
    exit 1
fi
echo "✅ docker-compose est disponible"
echo ""

# Vérifier les volumes Docker
echo "3. Vérification des volumes..."
VOLUMES=$(docker volume ls | grep yemma || true)
if [ -z "$VOLUMES" ]; then
    echo "⚠️  Aucun volume Yemma trouvé (normal si première exécution)"
else
    echo "✅ Volumes trouvés:"
    echo "$VOLUMES"
fi
echo ""

# Vérifier les conteneurs existants
echo "4. Vérification des conteneurs existants..."
CONTAINERS=$(docker ps -a --filter "name=yemma" --format "{{.Names}}\t{{.Status}}" || true)
if [ -z "$CONTAINERS" ]; then
    echo "⚠️  Aucun conteneur Yemma trouvé"
else
    echo "Conteneurs trouvés:"
    echo "$CONTAINERS"
fi
echo ""

# Vérifier les ports utilisés
echo "5. Vérification des ports..."
PORTS=(5432 6379 9000 9001 9200 9300 5601 8001 8002 8003 8004 8005 8006 8007 8008 8009 3000 80 443)
for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠️  Port $port est déjà utilisé"
        lsof -Pi :$port -sTCP:LISTEN | head -1
    fi
done
echo ""

# Vérifier le fichier .env
echo "6. Vérification du fichier .env..."
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env non trouvé"
    if [ -f "env.example" ]; then
        echo "   Création d'un fichier .env à partir de env.example..."
        cp env.example .env
        echo "✅ Fichier .env créé"
    fi
else
    echo "✅ Fichier .env trouvé"
fi
echo ""

# Vérifier les permissions sur les volumes
echo "7. Vérification des permissions..."
if [ -d "/var/lib/docker/volumes" ] || [ -d "$HOME/.docker/volumes" ]; then
    echo "✅ Répertoire de volumes accessible"
else
    echo "⚠️  Impossible de vérifier les permissions des volumes"
fi
echo ""

# Tenter de voir les logs PostgreSQL
echo "8. Tentative de récupération des logs PostgreSQL..."
if docker ps -a --filter "name=yemma-postgres" --format "{{.Names}}" | grep -q "yemma-postgres"; then
    echo "Logs du conteneur PostgreSQL (dernières 20 lignes):"
    docker logs yemma-postgres 2>&1 | tail -20 || echo "Impossible de récupérer les logs"
else
    echo "⚠️  Le conteneur PostgreSQL n'existe pas encore"
fi
echo ""

# Suggestions
echo "=============================================="
echo "💡 Suggestions de résolution:"
echo ""
echo "1. Arrêter tous les conteneurs:"
echo "   docker-compose down"
echo ""
echo "2. Supprimer les volumes (ATTENTION: supprime les données):"
echo "   docker-compose down -v"
echo ""
echo "3. Vérifier les logs PostgreSQL:"
echo "   docker-compose logs postgres"
echo ""
echo "4. Redémarrer proprement:"
echo "   docker-compose down"
echo "   docker-compose up -d postgres"
echo "   docker-compose logs -f postgres"
echo ""
echo "5. Si le problème persiste, vérifier les permissions:"
echo "   sudo chown -R \$USER:\$USER ~/.docker"
echo ""
