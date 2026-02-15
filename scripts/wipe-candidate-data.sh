#!/bin/bash
#
# Lance le script d'effacement des données candidats (mode développement).
# Exécute le script Python dans le conteneur candidate (asyncpg, dotenv déjà installés).
#
# Usage:
#   ./scripts/wipe-candidate-data.sh
#   ./scripts/wipe-candidate-data.sh --with-users
#   ./scripts/wipe-candidate-data.sh --all
#   ./scripts/wipe-candidate-data.sh -y
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="docker-compose.dev.yml"

cd "$PROJECT_DIR"

if ! docker compose -f "$COMPOSE_FILE" ps candidate 2>/dev/null | grep -q Up; then
  echo "❌ Le service candidate n'est pas démarré."
  echo "   Lancez : docker compose -f $COMPOSE_FILE up -d postgres candidate"
  exit 1
fi

# Monter la racine du projet pour accéder au script et au .env
# ELASTICSEARCH_HOST=elasticsearch pour résolution DNS dans le réseau Docker
docker compose -f "$COMPOSE_FILE" run --rm \
  -v "$PROJECT_DIR:/workspace" -w /workspace \
  -e ELASTICSEARCH_HOST=elasticsearch \
  -e ELASTICSEARCH_PORT=9200 \
  candidate python /workspace/scripts/wipe_candidate_data.py "$@"
