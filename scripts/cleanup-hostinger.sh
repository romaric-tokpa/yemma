#!/bin/bash
# Nettoie les conteneurs Yemma existants avant un nouveau déploiement Hostinger.
# À exécuter sur le VPS Hostinger via SSH avant de lancer le déploiement.
# Fonctionne depuis n'importe quel répertoire (pas besoin du projet).
#
# Usage sur le VPS : ./scripts/cleanup-hostinger.sh
# Ou via SSH : ssh user@vps 'bash -s' < scripts/cleanup-hostinger.sh

set -e

echo "🧹 Nettoyage des conteneurs Yemma pour redéploiement"
echo "===================================================="

# Arrêter les conteneurs yemma-*
echo "1. Arrêt des conteneurs yemma-*..."
docker ps -q -f "name=yemma-" 2>/dev/null | xargs -r docker stop 2>/dev/null || true
echo "   ✅ Conteneurs arrêtés"

# Supprimer les conteneurs (arrêtés et en cours)
echo ""
echo "2. Suppression des conteneurs yemma-*..."
CONTAINERS=$(docker ps -aq -f "name=yemma-" 2>/dev/null || true)
if [ -n "$CONTAINERS" ]; then
  echo "$CONTAINERS" | xargs docker rm -f
  echo "   ✅ $(echo "$CONTAINERS" | wc -l) conteneur(s) supprimé(s)"
else
  echo "   ⏭️  Aucun conteneur à supprimer"
fi

echo ""
echo "===================================================="
echo "✅ Nettoyage terminé. Relancez le déploiement depuis Hostinger."
echo ""
