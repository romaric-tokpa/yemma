#!/bin/bash
# Crée un compte super administrateur Yemma
# Le compte est créé automatiquement au démarrage du service auth.
# Utilisez ce script pour le créer manuellement ou après un reset de la base.

set -e
cd "$(dirname "$0")/.."

# Charger .env si présent
[ -f .env ] && set -a && source .env && set +a

EMAIL="${SUPER_ADMIN_EMAIL:-admin@yemma.com}"
PASSWORD="${SUPER_ADMIN_PASSWORD:-12345678}"

echo "=== Création du compte Super Admin ==="
echo "Email:    $EMAIL"
echo "Password: $PASSWORD"
echo ""

# Option 1 : Via Docker (si auth tourne)
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q yemma-auth; then
  echo "Exécution du seed dans le conteneur auth..."
  docker exec -e SUPER_ADMIN_EMAIL="$EMAIL" -e SUPER_ADMIN_PASSWORD="$PASSWORD" yemma-auth python -c "
import asyncio
from app.infrastructure.seed import seed_admin_user
asyncio.run(seed_admin_user())
"
  echo ""
  echo "✅ Super admin créé."
  echo "   Connexion : $EMAIL / $PASSWORD"
  echo "   URL : http://localhost:3000/login (ou votre FRONTEND_URL)"
  exit 0
fi

# Option 2 : Démarrer auth une fois pour déclencher le seed
echo "Le conteneur auth n'est pas démarré."
echo "Démarrez-le pour créer automatiquement le super admin :"
echo ""
echo "  docker-compose -f docker-compose.dev.yml up -d postgres redis auth"
echo ""
echo "Le super admin sera créé au démarrage avec :"
echo "  Email:    $EMAIL"
echo "  Password: $PASSWORD"
echo ""
echo "Pour personnaliser, définissez avant le démarrage :"
echo "  export SUPER_ADMIN_EMAIL=votre@email.com"
echo "  export SUPER_ADMIN_PASSWORD=VotreMotDePasse"
exit 1
