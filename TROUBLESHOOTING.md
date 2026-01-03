# Guide de dépannage

## Erreur : Port 5432 déjà utilisé

### Symptôme
```
Error response from daemon: failed to bind host port 0.0.0.0:5432/tcp: address already in use
```

### Solutions

#### Solution 1 : Arrêter PostgreSQL local (recommandé)

Si vous avez PostgreSQL installé localement :

```bash
# Vérifier si PostgreSQL est en cours d'exécution
sudo systemctl status postgresql

# Arrêter PostgreSQL local
sudo systemctl stop postgresql

# Empêcher le démarrage automatique (optionnel)
sudo systemctl disable postgresql
```

#### Solution 2 : Arrêter les conteneurs Docker existants

```bash
# Arrêter tous les conteneurs Docker
docker stop $(docker ps -aq)

# Supprimer les conteneurs arrêtés
docker rm $(docker ps -aq)

# Ou spécifiquement pour yemma-postgres
docker stop yemma-postgres
docker rm yemma-postgres
```

#### Solution 3 : Changer le port PostgreSQL dans Docker

Modifier le fichier `.env` :

```bash
# Changer le port de 5432 à 5433
DB_PORT=5433
```

Puis modifier `docker-compose.yml` pour utiliser ce port :

```yaml
ports:
  - "${DB_PORT:-5433}:5432"
```

#### Solution 4 : Identifier et arrêter le processus utilisant le port

```bash
# Trouver le processus utilisant le port 5432
sudo lsof -i :5432
# ou
sudo netstat -tulpn | grep :5432
# ou
sudo ss -tulpn | grep :5432

# Arrêter le processus (remplacer PID par l'ID du processus)
sudo kill -9 <PID>
```

## Erreur : Permission denied pour Docker

### Symptôme
```
permission denied while trying to connect to the docker API at unix:///var/run/docker.sock
```

### Solution

Ajouter votre utilisateur au groupe docker :

```bash
# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Se déconnecter et reconnecter (ou utiliser newgrp)
newgrp docker

# Vérifier que ça fonctionne
docker ps
```

## Erreur : Conteneurs ne démarrent pas

### Vérifier l'état des conteneurs

```bash
# Voir tous les conteneurs
docker ps -a

# Voir les logs d'un conteneur
docker logs yemma-postgres
docker logs yemma-auth

# Voir les logs en temps réel
docker logs -f yemma-postgres
```

### Redémarrer proprement

```bash
# Arrêter tous les services
docker-compose down

# Nettoyer les volumes (⚠️ supprime les données)
docker-compose down -v

# Rebuild et redémarrer
docker-compose up -d --build
```

## Erreur : Services ne sont pas "healthy"

### Vérifier les healthchecks

```bash
# Voir l'état de santé
docker-compose ps

# Vérifier les logs
docker-compose logs postgres
docker-compose logs auth
```

### Attendre que les services soient prêts

Certains services (comme PostgreSQL et ElasticSearch) prennent du temps à démarrer :

```bash
# Attendre que PostgreSQL soit prêt
until docker exec yemma-postgres pg_isready -U postgres; do
  echo "En attente de PostgreSQL..."
  sleep 2
done

# Attendre qu'ElasticSearch soit prêt
until curl -f http://localhost:9200/_cluster/health; do
  echo "En attente d'ElasticSearch..."
  sleep 5
done
```

## Erreur : Conflit de ports multiples

### Vérifier tous les ports

```bash
# Utiliser le script de vérification
./scripts/fix-port-conflict.sh
```

### Modifier les ports dans .env

Si plusieurs ports sont en conflit, modifiez le fichier `.env` :

```env
# Ports alternatifs
DB_PORT=5433
REDIS_PORT=6380
AUTH_PORT=8001
CANDIDATE_PORT=8002
# etc.
```

## Erreur : Base de données non initialisée

### Exécuter les migrations

```bash
# Pour le service auth
docker-compose exec auth alembic upgrade head

# Pour tous les services
make migrate-all
```

### Vérifier la connexion à la base de données

```bash
# Se connecter à PostgreSQL
docker-compose exec postgres psql -U postgres -d yemma_db

# Lister les bases de données
docker-compose exec postgres psql -U postgres -c "\l"
```

## Erreur : ElasticSearch ne démarre pas

### Vérifier les logs

```bash
docker-compose logs elasticsearch
```

### Vérifier les ressources système

ElasticSearch nécessite au moins 512MB de RAM :

```bash
# Vérifier la mémoire disponible
free -h

# Vérifier les limites Docker
docker stats --no-stream
```

### Réduire la mémoire d'ElasticSearch

Dans `docker-compose.yml`, modifier :

```yaml
environment:
  - "ES_JAVA_OPTS=-Xms256m -Xmx256m"  # Réduire à 256MB
```

## Nettoyage complet

Si rien ne fonctionne, faire un nettoyage complet :

```bash
# Arrêter tous les conteneurs
docker-compose down -v

# Supprimer toutes les images
docker rmi $(docker images -q yemma-*)

# Nettoyer le système Docker
docker system prune -a --volumes

# Redémarrer
docker-compose up -d --build
```

## Commandes utiles

```bash
# Voir l'utilisation des ressources
docker stats

# Voir l'espace disque utilisé
docker system df

# Voir les volumes
docker volume ls | grep yemma

# Supprimer un volume spécifique
docker volume rm yemma-postgres_data
```

