#!/bin/bash
#
# Réinitialise la base de données : supprime toutes les données et tous les comptes.
# Les tables sont vidées mais la structure et les migrations sont conservées.
#
# Prérequis : PostgreSQL doit tourner (docker-compose up -d postgres au minimum).
# Usage : ./scripts/reset-database.sh
#         ou avec docker-compose dev : ./scripts/reset-database.sh docker-compose.dev.yml
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

COMPOSE_FILE="${1:-docker-compose.yml}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$SCRIPT_DIR/reset-database.sql"

echo ""
echo "🗄️  Réinitialisation de la base de données Yemma"
echo "================================================"
echo ""
echo -e "${YELLOW}Ce script va supprimer :${NC}"
echo "  - Tous les comptes utilisateurs (candidats, recruteurs, admin)"
echo "  - Tous les profils candidats, expériences, compétences"
echo "  - Toutes les entreprises, invitations, équipes"
echo "  - Tous les documents, notifications, paiements, logs d'audit"
echo ""
echo -e "${YELLOW}Conservé : structure des tables et historique des migrations.${NC}"
echo ""

read -p "Continuer ? (o/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
  echo "Annulé."
  exit 0
fi

cd "$PROJECT_DIR"

if [ ! -f "$SQL_FILE" ]; then
  echo -e "${RED}❌ Fichier SQL introuvable : $SQL_FILE${NC}"
  exit 1
fi

# Vérifier que le conteneur postgres est bien là
if ! docker-compose -f "$COMPOSE_FILE" ps postgres 2>/dev/null | grep -q Up; then
  echo -e "${RED}❌ Le service PostgreSQL n'est pas démarré.${NC}"
  echo "   Lancez d'abord : docker-compose -f $COMPOSE_FILE up -d postgres"
  exit 1
fi

echo "📤 Exécution du script SQL sur la base yemma_db..."
if docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d yemma_db -f - < "$SQL_FILE"; then
  echo ""
  echo -e "${GREEN}✅ Base de données réinitialisée avec succès.${NC}"
  echo ""
  echo "Vous pouvez :"
  echo "  - Recréer un compte admin (si besoin) : voir services/auth-service (seed)"
  echo "  - Vous réinscrire sur /register/candidat ou /register/company"
  echo ""
else
  echo -e "${RED}❌ Erreur lors de l'exécution du script SQL.${NC}"
  echo "   Vérifiez que toutes les tables existent (migrations appliquées)."
  exit 1
fi
