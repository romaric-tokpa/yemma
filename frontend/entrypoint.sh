#!/bin/sh
set -e
cd /app
# Garantit que node_modules est installé (volume peut être vide au 1er run)
npm install
exec "$@"
