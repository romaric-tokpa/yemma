#!/bin/bash

# Script pour résoudre les conflits de ports

set -e

echo "🔍 Vérification des conflits de ports..."
echo "=========================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ports à vérifier
PORTS=(5432 6379 8001 8002 8003 8004 8005 8006 8007 8008 8009 9000 9001 9200 5601 3000)

check_port() {
    local port=$1
    if command -v lsof &> /dev/null; then
        if sudo lsof -i :$port &> /dev/null; then
            echo -e "${RED}❌ Port $port est utilisé${NC}"
            sudo lsof -i :$port | head -3
            return 1
        else
            echo -e "${GREEN}✅ Port $port est libre${NC}"
            return 0
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "${RED}❌ Port $port est utilisé${NC}"
            netstat -tulpn 2>/dev/null | grep ":$port " | head -3
            return 1
        else
            echo -e "${GREEN}✅ Port $port est libre${NC}"
            return 0
        fi
    elif command -v ss &> /dev/null; then
        if ss -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "${RED}❌ Port $port est utilisé${NC}"
            ss -tulpn 2>/dev/null | grep ":$port " | head -3
            return 1
        else
            echo -e "${GREEN}✅ Port $port est libre${NC}"
            return 0
        fi
    else
        echo -e "${YELLOW}⚠️  Impossible de vérifier le port $port (lsof/netstat/ss non disponible)${NC}"
        return 0
    fi
}

echo ""
echo "Vérification des ports requis..."
echo ""

CONFLICTS=0
for port in "${PORTS[@]}"; do
    if ! check_port $port; then
        CONFLICTS=$((CONFLICTS + 1))
    fi
done

echo ""
if [ $CONFLICTS -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les ports sont libres !${NC}"
    exit 0
else
    echo -e "${RED}❌ $CONFLICTS port(s) en conflit détecté(s)${NC}"
    echo ""
    echo "Solutions possibles :"
    echo ""
    echo "1. Arrêter les services locaux qui utilisent ces ports :"
    echo "   - PostgreSQL local : sudo systemctl stop postgresql"
    echo "   - Redis local : sudo systemctl stop redis"
    echo ""
    echo "2. Modifier les ports dans docker-compose.yml et .env"
    echo ""
    echo "3. Utiliser des ports alternatifs dans .env :"
    echo "   DB_PORT=5433"
    echo "   REDIS_PORT=6380"
    echo ""
    exit 1
fi

