#!/bin/bash

# Script pour corriger les problèmes PostgreSQL
# Usage: ./scripts/fix-postgres.sh

set -e

echo "🔧 Correction des problèmes PostgreSQL"
echo "======================================"
echo ""

# Arrêter tous les conteneurs
echo "1. Arrêt des conteneurs..."
docker-compose down 2>/dev/null || true
echo "✅ Conteneurs arrêtés"
echo ""

# Supprimer le conteneur PostgreSQL s'il existe
echo "2. Suppression du conteneur PostgreSQL..."
docker rm -f yemma-postgres 2>/dev/null || true
echo "✅ Conteneur supprimé"
echo ""

# Supprimer le volume PostgreSQL
echo "3. Suppression du volume PostgreSQL..."
read -p "⚠️  Cela supprimera toutes les données PostgreSQL. Continuer? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker volume rm yemma-postgres-data 2>/dev/null || true
    echo "✅ Volume supprimé"
else
    echo "⚠️  Volume conservé"
fi
echo ""

# Vérifier que le fichier .env existe
echo "4. Vérification du fichier .env..."
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env non trouvé, création depuis env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Fichier .env créé"
    else
        echo "❌ env.example non trouvé"
        exit 1
    fi
else
    echo "✅ Fichier .env trouvé"
fi
echo ""

# Vérifier les variables d'environnement essentielles
echo "5. Vérification des variables d'environnement..."
if grep -q "DB_USER=" .env && grep -q "DB_PASSWORD=" .env && grep -q "DB_NAME=" .env; then
    echo "✅ Variables d'environnement trouvées"
else
    echo "⚠️  Ajout des variables manquantes..."
    if ! grep -q "DB_USER=" .env; then
        echo "DB_USER=postgres" >> .env
    fi
    if ! grep -q "DB_PASSWORD=" .env; then
        echo "DB_PASSWORD=postgres" >> .env
    fi
    if ! grep -q "DB_NAME=" .env; then
        echo "DB_NAME=yemma_db" >> .env
    fi
    echo "✅ Variables ajoutées"
fi
echo ""

# Redémarrer PostgreSQL
echo "6. Démarrage de PostgreSQL..."
docker-compose up -d postgres
echo "✅ PostgreSQL démarré"
echo ""

# Attendre que PostgreSQL soit prêt
echo "7. Attente que PostgreSQL soit prêt..."
echo "   (cela peut prendre 10-30 secondes)"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres -d yemma_db > /dev/null 2>&1; then
        echo "✅ PostgreSQL est prêt!"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""
echo ""

# Afficher les logs
echo "8. Dernières lignes des logs PostgreSQL:"
docker-compose logs --tail=20 postgres
echo ""

echo "======================================"
echo "✅ Correction terminée!"
echo ""
echo "Pour démarrer tous les services:"
echo "  docker-compose up -d"
echo ""
echo "Pour voir les logs PostgreSQL:"
echo "  docker-compose logs -f postgres"
echo ""
