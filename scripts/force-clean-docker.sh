#!/bin/bash

# Script pour forcer le nettoyage de Docker en cas d'erreurs I/O
# Usage: ./scripts/force-clean-docker.sh

set -e

echo "🧹 Nettoyage forcé de Docker"
echo "============================"
echo ""
echo "⚠️  ATTENTION: Ce script va supprimer tous les conteneurs, images et volumes Yemma"
echo ""

read -p "Continuer? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Annulé."
    exit 1
fi

echo ""
echo "1. Arrêt de tous les conteneurs Yemma..."
docker-compose down 2>/dev/null || true
echo "✅ Conteneurs arrêtés"
echo ""

echo "2. Arrêt forcé de tous les conteneurs Yemma..."
docker ps -a --filter "name=yemma" --format "{{.ID}}" | while read id; do
    docker kill "$id" 2>/dev/null || true
    docker rm -f "$id" 2>/dev/null || true
done
echo "✅ Conteneurs supprimés"
echo ""

echo "3. Suppression des volumes Yemma..."
docker volume ls --filter "name=yemma" --format "{{.Name}}" | while read vol; do
    docker volume rm "$vol" 2>/dev/null || true
done
echo "✅ Volumes supprimés"
echo ""

echo "4. Nettoyage du système Docker..."
docker system prune -f 2>/dev/null || true
echo "✅ Système nettoyé"
echo ""

echo "5. Vérification de l'espace disque Docker..."
docker system df
echo ""

echo "============================"
echo "✅ Nettoyage terminé!"
echo ""
echo "Prochaines étapes:"
echo "1. Redémarrer Docker Desktop si nécessaire"
echo "2. Exécuter: docker-compose up -d postgres"
echo "3. Vérifier les logs: docker-compose logs -f postgres"
echo ""
