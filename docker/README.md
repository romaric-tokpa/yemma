# Docker Compose - Configuration

Configuration Docker Compose pour l'environnement de développement et production de la plateforme Yemma Solutions.

## 🎯 Vue d'ensemble

Ce dossier contient la configuration Docker Compose pour orchestrer tous les services de la plateforme, incluant les microservices backend, le frontend, et l'infrastructure (bases de données, cache, stockage, recherche).

## 📁 Structure

- `docker-compose.yml` : Configuration principale pour le développement
- `docker-compose.dev.yml` : Override pour développement avancé (optionnel)
- `docker-compose.prod.yml` : Configuration pour production (optionnel)

## 🏗️ Services inclus

### Infrastructure

| Service | Port | Description |
|---------|------|-------------|
| **PostgreSQL** (9 instances) | 5432-5440 | Bases de données par service |
| **Redis** | 6379 | Cache et sessions |
| **Elasticsearch** | 9200 | Moteur de recherche |
| **Kibana** | 5601 | Interface Elasticsearch (optionnel) |
| **MinIO** | 9000 | Stockage S3-compatible |
| **MinIO Console** | 9001 | Interface MinIO |
| **RabbitMQ** | 5672 | Message broker |
| **RabbitMQ Management** | 15672 | Interface RabbitMQ |

### Microservices Backend

| Service | Port Interne | Description |
|---------|--------------|-------------|
| **auth-service** | 8000 | Authentification et utilisateurs |
| **candidate-service** | 8000 | Profils candidats |
| **company-service** | 8000 | Entreprises et recruteurs |
| **admin-service** | 8000 | Administration |
| **search-service** | 8000 | Recherche Elasticsearch |
| **document-service** | 8000 | Gestion des documents |
| **payment-service** | 8000 | Paiements et abonnements |
| **notification-service** | 8000 | Notifications email |
| **audit-service** | 8000 | Audit RGPD |

### Frontend

| Service | Port Interne | Description |
|---------|--------------|-------------|
| **frontend** | 3000 | Application React |

### Gateway

| Service | Port | Description |
|---------|------|-------------|
| **nginx** | 80/443 | Reverse proxy et load balancer |

## 🌐 Réseaux Docker

Les services sont organisés en réseaux pour la sécurité et l'isolation :

- `yemma-network` : Réseau principal pour tous les services
- Réseaux spécifiques par service (optionnel pour isolation renforcée)

## 🚀 Utilisation

### 1. Configuration initiale

Copiez le fichier `env.example` à la racine du projet vers `.env` :

```bash
cp env.example .env
```

Éditez le fichier `.env` et modifiez les mots de passe et clés secrètes.

**Variables essentielles à modifier :**
- `DB_PASSWORD` : Mot de passe PostgreSQL
- `JWT_SECRET_KEY` : Clé secrète JWT (générer avec `openssl rand -hex 32`)
- `REDIS_PASSWORD` : Mot de passe Redis
- `ELASTICSEARCH_PASSWORD` : Mot de passe Elasticsearch
- `STRIPE_SECRET_KEY` : Clé API Stripe
- `S3_ACCESS_KEY` et `S3_SECRET_KEY` : Clés d'accès MinIO

### 2. Démarrer tous les services

Depuis la racine du projet :

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f

# Démarrer un service spécifique
docker-compose up -d auth-service
```

### 3. Vérifier l'état des services

```bash
# Voir le statut de tous les services
docker-compose ps

# Voir les services en cours d'exécution
docker-compose ps | grep Up
```

### 4. Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f auth-service

# Dernières 100 lignes
docker-compose logs --tail=100 auth-service
```

### 5. Arrêter les services

```bash
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v

# Arrêter un service spécifique
docker-compose stop auth-service
```

### 6. Rebuild les services

Après modification du code ou des Dockerfiles :

```bash
# Rebuild un service spécifique
docker-compose build auth-service
docker-compose up -d auth-service

# Rebuild tous les services
docker-compose build
docker-compose up -d
```

## 🌐 Accès aux services

### Services via Nginx Gateway

Tous les services sont accessibles via le port 80 :

- **Frontend** : http://localhost
- **API Auth** : http://localhost/api/v1/auth/*
- **API Candidate** : http://localhost/api/v1/candidates/*
- **API Company** : http://localhost/api/v1/companies/*
- **API Search** : http://localhost/api/v1/search/*
- Etc.

### Documentation API (Swagger)

- **Auth Service** : http://localhost/api/v1/auth/docs
- **Candidate Service** : http://localhost/api/v1/candidates/docs
- **Company Service** : http://localhost/api/v1/companies/docs
- **Search Service** : http://localhost/api/v1/search/docs
- **Admin Service** : http://localhost/api/v1/admin/docs

### Interfaces d'administration

- **RabbitMQ Management** : http://localhost:15672
  - User : `rabbitmq` (ou valeur de `RABBITMQ_USER`)
  - Password : `rabbitmq_password` (ou valeur de `RABBITMQ_PASSWORD`)

- **MinIO Console** : http://localhost:9001
  - User : `minioadmin` (ou valeur de `MINIO_ROOT_USER`)
  - Password : `minioadmin` (ou valeur de `MINIO_ROOT_PASSWORD`)

- **Kibana** : http://localhost:5601 (si activé)

### Bases de données PostgreSQL

Connexion depuis l'extérieur du conteneur :

```bash
# Auth DB
psql -h localhost -p 5432 -U postgres -d yemma_auth_db

# Candidate DB
psql -h localhost -p 5433 -U postgres -d yemma_candidate_db

# Company DB
psql -h localhost -p 5434 -U postgres -d yemma_company_db

# Etc. (ports 5432-5440)
```

## 🔍 Health Checks

Tous les services incluent des health checks. Vérifiez l'état :

```bash
# Voir le statut des health checks
docker-compose ps

# Les services doivent afficher "healthy" dans la colonne STATUS

# Tester manuellement
curl http://localhost/health
curl http://localhost/api/v1/auth/health
```

## 💾 Volumes persistants

Les données sont persistées dans des volumes Docker nommés :

- `yemma-postgres-auth-data`
- `yemma-postgres-candidate-data`
- `yemma-postgres-company-data`
- `yemma-postgres-admin-data`
- `yemma-postgres-document-data`
- `yemma-postgres-payment-data`
- `yemma-postgres-notification-data`
- `yemma-postgres-audit-data`
- `yemma-postgres-search-data` (si utilisé)
- `yemma-redis-data`
- `yemma-elasticsearch-data`
- `yemma-rabbitmq-data`
- `yemma-minio-data`

Pour voir les volumes :

```bash
docker volume ls | grep yemma
```

Pour supprimer un volume (⚠️ supprime les données) :

```bash
docker volume rm yemma-postgres-auth-data
```

## 🔧 Développement

### Hot Reload

Les services sont configurés avec des volumes montés pour le hot reload :

- **Backend** : Les fichiers Python sont montés, uvicorn avec `--reload`
- **Frontend** : Les fichiers React sont montés, Vite avec HMR

Modifiez le code et les changements seront reflétés automatiquement.

### Migrations de base de données

Exécutez les migrations depuis le conteneur :

```bash
# Auth Service
docker-compose exec auth-service alembic upgrade head

# Candidate Service
docker-compose exec candidate-service alembic upgrade head

# Company Service
docker-compose exec company-service alembic upgrade head
```

### Shell interactif

Accédez au shell d'un service :

```bash
# Shell bash
docker-compose exec auth-service /bin/bash

# Shell Python interactif
docker-compose exec auth-service python
```

### Exécuter des commandes

```bash
# Exécuter une commande dans un service
docker-compose exec auth-service python -m pytest

# Exécuter une commande dans un service arrêté
docker-compose run --rm auth-service python manage.py migrate
```

## 🐛 Dépannage

### Service ne démarre pas

1. **Vérifiez les logs** :
   ```bash
   docker-compose logs <service-name>
   ```

2. **Vérifiez les health checks** :
   ```bash
   docker-compose ps
   ```

3. **Vérifiez les variables d'environnement** dans `.env`

4. **Vérifiez les dépendances** :
   ```bash
   # Vérifier que PostgreSQL est démarré
   docker-compose ps postgres-auth
   ```

### Port déjà utilisé

Modifiez le port dans le fichier `.env` ou `docker-compose.yml` :

```env
AUTH_SERVICE_PORT=8005  # Au lieu de 8001
```

Ou arrêtez le service qui utilise le port :

```bash
# Trouver le processus utilisant le port
lsof -i :8001

# Arrêter le processus
kill -9 <PID>
```

### Réinitialiser une base de données

```bash
# Supprimer le volume
docker volume rm yemma-postgres-auth-data

# Redémarrer le service
docker-compose up -d postgres-auth

# Réexécuter les migrations
docker-compose exec auth-service alembic upgrade head
```

### Problèmes de réseau

```bash
# Vérifier les réseaux Docker
docker network ls

# Inspecter un réseau
docker network inspect yemma-network

# Recréer les réseaux
docker-compose down
docker-compose up -d
```

### Problèmes de permissions

```bash
# Vérifier les permissions des volumes
docker volume inspect yemma-postgres-auth-data

# Réparer les permissions (si nécessaire)
sudo chown -R 999:999 /var/lib/docker/volumes/yemma-postgres-auth-data
```

## 🔐 Sécurité

⚠️ **Important pour la production** :

1. **Changez tous les mots de passe** dans `.env`
2. **Générez des clés secrètes fortes** :
   ```bash
   openssl rand -hex 32  # Pour JWT_SECRET_KEY
   ```
3. **Ne commitez jamais** le fichier `.env`
4. **Utilisez des secrets managers** en production :
   - AWS Secrets Manager
   - HashiCorp Vault
   - Docker Secrets
5. **Configurez HTTPS** avec certificats SSL valides
6. **Limitez l'accès** aux ports d'administration (15672, 9001, 5601)
7. **Utilisez des réseaux Docker privés** pour isoler les services

## 📊 Monitoring

### Ressources système

```bash
# Voir l'utilisation des ressources
docker stats

# Voir l'utilisation d'un service spécifique
docker stats auth-service
```

### Logs centralisés

Pour la production, considérez :
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Loki + Grafana**
- **CloudWatch** (AWS)
- **Datadog**

## 🚀 Production

### Configuration recommandée

1. **Utiliser docker-compose.prod.yml** avec :
   - Ressources limitées par service
   - Restart policies
   - Health checks renforcés
   - Logging configuré

2. **Mettre en place un orchestrateur** :
   - Docker Swarm
   - Kubernetes
   - Nomad

3. **Configurer le monitoring** :
   - Prometheus + Grafana
   - Alerting

4. **Backups automatiques** :
   - Bases de données
   - Volumes Docker
   - MinIO/S3

## 📝 Commandes utiles

```bash
# Voir l'utilisation des ressources
docker stats

# Nettoyer les ressources inutilisées
docker system prune -a

# Voir l'espace disque utilisé
docker system df

# Inspecter un service
docker-compose exec auth-service env

# Voir les variables d'environnement d'un service
docker-compose config | grep -A 20 auth-service
```

## 🚀 Prochaines étapes

- [ ] Créer docker-compose.prod.yml pour production
- [ ] Ajouter les configurations de monitoring
- [ ] Implémenter les backups automatiques
- [ ] Configurer le load balancing
- [ ] Ajouter les configurations de scaling

---

**Configuration développée pour Yemma Solutions**
