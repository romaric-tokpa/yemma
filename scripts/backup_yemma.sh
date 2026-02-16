#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"

# Sauvegarder les bases de données principales
docker exec yemma-postgres-candidate pg_dump -U postgres candidate_db > $BACKUP_DIR/candidate_$DATE.sql
docker exec yemma-postgres-auth pg_dump -U postgres auth_db > $BACKUP_DIR/auth_$DATE.sql

# Compresser
gzip $BACKUP_DIR/candidate_$DATE.sql
gzip $BACKUP_DIR/auth_$DATE.sql

# Supprimer les backups de plus de 7 jours
find $BACKUP_DIR -type f -name "*.gz" -mtime +7 -delete

echo "Backup terminé : $DATE"
