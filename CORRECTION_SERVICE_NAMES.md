# Correction des noms de services Docker Compose

## Erreur rencontrée

```bash
docker compose up auth-service
# Erreur: no such service: auth-service
```

## Solution

Le service s'appelle `auth`, pas `auth-service`.

## Noms corrects des services

Voici les noms corrects des services dans `docker-compose.yml` :

### Infrastructure
- `postgres` (pas `postgres-service`)
- `redis` (pas `redis-service`)
- `minio` (pas `minio-service`)
- `elasticsearch` (pas `elasticsearch-service`)
- `rabbitmq` (pas `rabbitmq-service`)

### Services applicatifs
- `auth` (pas `auth-service`)
- `candidate` (pas `candidate-service`)
- `document` (pas `document-service`)
- `search` (pas `search-service`)
- `company` (pas `company-service`)
- `payment` (pas `payment-service`)
- `notification` (pas `notification-service`)
- `audit` (pas `audit-service`)
- `admin` (pas `admin-service`)

### Frontend
- `frontend` (pas `frontend-service`)

## Commandes correctes

```bash
# Démarrer un service
docker compose up auth
docker compose up candidate
docker compose up postgres redis

# Démarrer en arrière-plan
docker compose up -d auth

# Voir les logs
docker compose logs auth
docker compose logs candidate

# Arrêter un service
docker compose stop auth

# Redémarrer un service
docker compose restart auth

# Voir les services disponibles
docker compose config --services
```

## Note

Le nom du conteneur Docker est différent du nom du service :
- **Service** : `auth` (utilisé dans docker compose)
- **Conteneur** : `yemma-auth` (défini par `container_name`)

Pour interagir avec le conteneur directement :
```bash
docker exec yemma-auth <command>
docker logs yemma-auth
```

