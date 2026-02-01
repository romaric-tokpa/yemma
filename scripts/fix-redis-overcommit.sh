#!/bin/bash
# Script pour corriger le warning Redis "Memory overcommit must be enabled"
# À exécuter sur le VPS Hostinger (Linux) via SSH avec les droits root
#
# Usage sur le VPS : sudo ./scripts/fix-redis-overcommit.sh
# ou: ssh user@vps 'sudo bash -s' < scripts/fix-redis-overcommit.sh

set -e

if [ "$(id -u)" -ne 0 ]; then
    echo "⚠️  Ce script doit être exécuté avec les droits root (sudo)"
    echo "Usage: sudo $0"
    exit 1
fi

# vm.overcommit_memory est un paramètre Linux uniquement (n'existe pas sur macOS)
if [ "$(uname)" != "Linux" ]; then
    echo "⚠️  Ce script est réservé au VPS Hostinger (Linux)."
    echo "   Sur $(uname), vm.overcommit_memory n'existe pas."
    echo ""
    echo "   Exécutez-le sur votre VPS via SSH :"
    echo "   ssh user@votre-vps-hostinger 'sudo bash -s' < scripts/fix-redis-overcommit.sh"
    exit 1
fi

echo "🔧 Correction du paramètre vm.overcommit_memory pour Redis"
echo "=========================================================="

# Appliquer immédiatement
echo "1. Application de vm.overcommit_memory=1..."
set +e
ERR=$(sysctl vm.overcommit_memory=1 2>&1)
STATUS=$?
set -e
if [ $STATUS -eq 0 ]; then
    echo "✅ Paramètre appliqué (effet immédiat)"
else
    echo "❌ Erreur: $ERR"
    echo ""
    echo "   Sur un VPS mutualisé, ce paramètre peut être verrouillé."
    echo "   Le warning Redis est inoffensif si les sauvegardes réussissent."
    exit 1
fi

# Persister après reboot
CONF_FILE="/etc/sysctl.d/99-redis-overcommit.conf"
echo ""
echo "2. Persistance du paramètre après reboot..."
if grep -q "vm.overcommit_memory" "$CONF_FILE" 2>/dev/null; then
    echo "✅ Configuration déjà présente dans $CONF_FILE"
else
    echo "vm.overcommit_memory = 1" | tee "$CONF_FILE" > /dev/null
    echo "✅ Configuration ajoutée dans $CONF_FILE"
fi

echo ""
echo "=========================================================="
echo "✅ Correction terminée!"
echo ""
echo "Redis ne devrait plus afficher le warning au prochain redémarrage."
echo "Pour redémarrer Redis maintenant: docker compose restart redis"
echo ""
