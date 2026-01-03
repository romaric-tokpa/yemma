#!/bin/bash

# Script d'initialisation pour l'environnement de développement
# Usage: ./scripts/init_dev.sh

set -e

echo "🚀 Initialisation de l'environnement de développement Yemma Solutions"
echo ""

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env depuis env.example..."
    cp env.example .env
    echo "✅ Fichier .env créé"
    echo "⚠️  IMPORTANT: Modifiez les mots de passe et clés secrètes dans .env avant de continuer !"
    echo ""
    read -p "Voulez-vous continuer maintenant ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Arrêt de l'initialisation. Modifiez .env et relancez le script."
        exit 0
    fi
else
    echo "✅ Fichier .env existe déjà"
fi

# Vérifier que les services ne sont pas déjà en cours d'exécution
if docker-compose -f docker/docker-compose.yml ps | grep -q "Up"; then
    echo "⚠️  Des services sont déjà en cours d'exécution"
    read -p "Voulez-vous les redémarrer ? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Arrêt des services existants..."
        docker-compose -f docker/docker-compose.yml down
    else
        echo "✅ Services déjà démarrés"
        exit 0
    fi
fi

# Build et démarrage des services
echo ""
echo "🔨 Build des images Docker..."
docker-compose -f docker/docker-compose.yml build

echo ""
echo "🚀 Démarrage des services..."
docker-compose -f docker/docker-compose.yml up -d

echo ""
echo "⏳ Attente que les services soient prêts..."
sleep 10

# Vérifier l'état des services
echo ""
echo "📊 État des services :"
docker-compose -f docker/docker-compose.yml ps

echo ""
echo "✅ Initialisation terminée !"
echo ""
echo "📡 URLs d'accès :"
echo "  - Auth Service:      http://localhost:8001/docs"
echo "  - Candidate Service: http://localhost:8002/docs"
echo "  - Admin Service:     http://localhost:8003/docs"
echo "  - Document Service:  http://localhost:8004/docs"
echo ""
echo "🔧 Interfaces d'administration :"
echo "  - RabbitMQ:          http://localhost:15672"
echo "  - MinIO Console:     http://localhost:9001"
echo ""
echo "📚 Commandes utiles :"
echo "  - Voir les logs:     make logs"
echo "  - Arrêter:           make down"
echo "  - Redémarrer:        make restart"
echo "  - État:              make ps"
echo ""

