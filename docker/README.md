# Docker Compose - Configuration

Ce dossier contient la configuration Docker Compose pour l'environnement de développement local.

## Structure

- `docker-compose.yml` : Configuration principale pour le développement
- `docker-compose.dev.yml` : Override pour développement avancé (optionnel)
- `docker-compose.prod.yml` : Configuration pour production (optionnel)

## Services inclus

### Infrastructure
- **PostgreSQL** (3 instances) : Une base de données par service
  - `postgres-auth` : Port 5432
  - `postgres-candidate` : Port 5433
  - `postgres-admin` : Port 5434
- **RabbitMQ** : Message broker (Port 5672, Management UI: 15672)
- **MinIO** : Object storage S3-compatible (Port 9000, Console: 9001)

### Microservices
- **auth-service** : Port 8001
- **candidate-service** : Port 8002
- **admin-service** : Port 8003
- **document-service** : Port 8004

## Réseaux Docker

Les services sont isolés dans des réseaux séparés pour la sécurité :

- `yemma-auth-network` : Auth service + PostgreSQL auth
- `yemma-candidate-network` : Candidate service + PostgreSQL candidate
- `yemma-admin-network` : Admin service + PostgreSQL admin
- `yemma-storage-network` : Document service + MinIO
- `yemma-messaging-network` : Tous les services + RabbitMQ

## Utilisation

### 1. Configuration initiale

Copiez le fichier `.env.example` à la racine du projet vers `.env` :

```bash
cp .env.example .env
```

Éditez le fichier `.env` et modifiez les mots de passe et clés secrètes.

### 2. Démarrer les services

Depuis le dossier `docker/` :

```bash
cd docker
docker-compose up -d
```

Ou depuis la racine du projet :

```bash
docker-compose -f docker/docker-compose.yml up -d
```

### 3. Vérifier l'état des services

```bash
docker-compose -f docker/docker-compose.yml ps
```

### 4. Voir les logs

Tous les services :
```bash
docker-compose -f docker/docker-compose.yml logs -f
```

Un service spécifique :
```bash
docker-compose -f docker/docker-compose.yml logs -f auth-service
```

### 5. Arrêter les services

```bash
docker-compose -f docker/docker-compose.yml down
```

Pour supprimer aussi les volumes (⚠️ supprime les données) :
```bash
docker-compose -f docker/docker-compose.yml down -v
```

### 6. Rebuild les services

Après modification du code ou des Dockerfiles :

```bash
docker-compose -f docker/docker-compose.yml up -d --build
```

## Accès aux services

### Services FastAPI
- Auth Service : http://localhost:8001
- Candidate Service : http://localhost:8002
- Admin Service : http://localhost:8003
- Document Service : http://localhost:8004

### Documentation API (Swagger)
- Auth Service : http://localhost:8001/docs
- Candidate Service : http://localhost:8002/docs
- Admin Service : http://localhost:8003/docs
- Document Service : http://localhost:8004/docs

### RabbitMQ Management UI
- URL : http://localhost:15672
- User : `rabbitmq` (ou valeur de `RABBITMQ_USER`)
- Password : `rabbitmq_password` (ou valeur de `RABBITMQ_PASSWORD`)

### MinIO Console
- URL : http://localhost:9001
- User : `minioadmin` (ou valeur de `MINIO_ROOT_USER`)
- Password : `minioadmin123` (ou valeur de `MINIO_ROOT_PASSWORD`)

### Bases de données PostgreSQL

Connexion depuis l'extérieur du conteneur :

```bash
# Auth DB
psql -h localhost -p 5432 -U auth_user -d auth_db

# Candidate DB
psql -h localhost -p 5433 -U candidate_user -d candidate_db

# Admin DB
psql -h localhost -p 5434 -U admin_user -d admin_db
```

## Health Checks

Tous les services incluent des health checks. Vérifiez l'état :

```bash
docker-compose -f docker/docker-compose.yml ps
```

Les services doivent afficher `healthy` dans la colonne `STATUS`.

## Volumes persistants

Les données sont persistées dans des volumes Docker nommés :

- `yemma-postgres-auth-data`
- `yemma-postgres-candidate-data`
- `yemma-postgres-admin-data`
- `yemma-rabbitmq-data`
- `yemma-minio-data`
- `yemma-document-temp`

Pour voir les volumes :
```bash
docker volume ls | grep yemma
```

## Développement

### Hot Reload

Les services sont configurés avec des volumes montés pour le hot reload. Modifiez le code et les changements seront reflétés automatiquement (si le service supporte le reload).

### Migrations de base de données

Exécutez les migrations depuis le conteneur :

```bash
# Auth Service
docker-compose -f docker/docker-compose.yml exec auth-service alembic upgrade head

# Candidate Service
docker-compose -f docker/docker-compose.yml exec candidate-service alembic upgrade head

# Admin Service
docker-compose -f docker/docker-compose.yml exec admin-service alembic upgrade head
```

### Shell interactif

Accédez au shell d'un service :

```bash
docker-compose -f docker/docker-compose.yml exec auth-service /bin/bash
```

## Dépannage

### Service ne démarre pas

1. Vérifiez les logs :
   ```bash
   docker-compose -f docker/docker-compose.yml logs <service-name>
   ```

2. Vérifiez les health checks :
   ```bash
   docker-compose -f docker/docker-compose.yml ps
   ```

3. Vérifiez les variables d'environnement dans `.env`

### Port déjà utilisé

Modifiez le port dans le fichier `.env` :

```env
AUTH_SERVICE_PORT=8005  # Au lieu de 8001
```

### Réinitialiser une base de données

```bash
# Supprimer le volume
docker volume rm yemma-postgres-auth-data

# Redémarrer le service
docker-compose -f docker/docker-compose.yml up -d postgres-auth
```

## Sécurité

⚠️ **Important pour la production** :

1. Changez tous les mots de passe dans `.env`
2. Générez des clés secrètes fortes :
   ```bash
   openssl rand -hex 32  # Pour JWT_SECRET_KEY
   ```
3. Ne commitez jamais le fichier `.env`
4. Utilisez des secrets managers en production (AWS Secrets Manager, HashiCorp Vault, etc.)

## Prochaines étapes

1. Créer les Dockerfiles pour chaque service
2. Implémenter les endpoints de health check
3. Configurer les migrations Alembic
4. Ajouter les tests d'intégration

