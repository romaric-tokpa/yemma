# Guide de démarrage des services backend

Ce guide vous explique comment lancer tous les services backend de la plateforme Yemma Solutions.

## Prérequis

- Docker et Docker Compose installés
- Au moins 4 Go de RAM disponibles
- Ports disponibles : 5432, 6379, 8000-8010, 9000-9001, 9200, 5601

## Démarrage rapide

### 1. Initialiser les variables d'environnement

```bash
# Créer le fichier .env depuis le template
cp env.example .env

# Éditer le fichier .env et modifier les mots de passe si nécessaire
nano .env
```

### 2. Lancer tous les services

```bash
# Option 1 : Utiliser Docker Compose directement
docker-compose up -d

# Option 2 : Utiliser le Makefile
make up
```

### 3. Vérifier l'état des services

```bash
# Voir l'état de tous les services
docker-compose ps

# Ou avec Makefile
make ps

# Voir les logs
docker-compose logs -f

# Ou pour un service spécifique
docker-compose logs -f auth
```

## Services disponibles

### Infrastructure

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| PostgreSQL | 5432 | `postgresql://postgres:postgres@localhost:5432/yemma_db` | Base de données principale |
| Redis | 6379 | `redis://localhost:6379` | Cache et broker |
| MinIO | 9000/9001 | http://localhost:9001 | Stockage S3 (Console: minioadmin/minioadmin123) |
| ElasticSearch | 9200 | http://localhost:9200 | Moteur de recherche |
| Kibana | 5601 | http://localhost:5601 | Visualisation ElasticSearch |

### Services applicatifs

| Service | Port | URL API Docs | Description |
|---------|------|--------------|-------------|
| Auth | 8001 | http://localhost:8001/docs | Authentification et gestion des utilisateurs |
| Candidate | 8002 | http://localhost:8002/docs | Gestion des profils candidats |
| Admin | 8009 | http://localhost:8009/docs | Validation et gestion des candidats |
| Document | 8003 | http://localhost:8003/docs | Gestion des documents |
| Search | 8004 | http://localhost:8004/docs | Recherche ElasticSearch |
| Company | 8005 | http://localhost:8005/docs | Gestion des entreprises et recruteurs |
| Payment | 8006 | http://localhost:8006/docs | Paiements et abonnements Stripe |
| Notification | 8007 | http://localhost:8007/docs | Notifications asynchrones |
| Audit | 8008 | http://localhost:8008/docs | Logs et audit RGPD |
| Frontend | 3000 | http://localhost:3000 | Interface React |

## Commandes utiles

### Avec Docker Compose

```bash
# Démarrer tous les services
docker-compose up -d

# Démarrer un service spécifique
docker-compose up -d auth

# Arrêter tous les services
docker-compose down

# Arrêter un service spécifique
docker-compose stop auth

# Redémarrer un service
docker-compose restart auth

# Voir les logs d'un service
docker-compose logs -f auth

# Rebuild un service
docker-compose build auth
docker-compose up -d auth

# Accéder au shell d'un service
docker-compose exec auth /bin/bash
```

### Avec Makefile

```bash
# Afficher l'aide
make help

# Initialiser le fichier .env
make init-env

# Démarrer tous les services
make up

# Arrêter tous les services
make down

# Redémarrer tous les services
make restart

# Voir les logs
make logs                    # Tous les services
make logs-auth              # Service auth uniquement
make logs-candidate         # Service candidate uniquement

# Voir l'état des services
make ps

# Rebuild les images
make build

# Voir les URLs d'accès
make urls

# Exécuter les migrations
make migrate-auth
make migrate-all
```

## Démarrage par étapes (recommandé pour les tests)

### Étape 1 : Infrastructure de base

```bash
# Lancer PostgreSQL, Redis, MinIO
docker-compose up -d postgres redis minio

# Attendre que les services soient prêts (environ 30 secondes)
docker-compose ps
```

### Étape 2 : Services de base

```bash
# Lancer Auth et Candidate
docker-compose up -d auth candidate

# Vérifier les logs
docker-compose logs -f auth candidate
```

### Étape 3 : Services avancés

```bash
# Lancer ElasticSearch et Search
docker-compose up -d elasticsearch kibana search

# Attendre qu'ElasticSearch soit prêt (environ 1 minute)
docker-compose logs -f elasticsearch
```

### Étape 4 : Services complémentaires

```bash
# Lancer les autres services
docker-compose up -d admin document company payment notification audit
```

### Étape 5 : Frontend (optionnel)

```bash
# Lancer le frontend
docker-compose up -d frontend
```

## Vérification de santé

### Vérifier que tous les services sont en cours d'exécution

```bash
docker-compose ps
```

Tous les services doivent afficher `Up` et `healthy` (ou `running`).

### Tester les endpoints de santé

```bash
# Auth Service
curl http://localhost:8001/health

# Candidate Service
curl http://localhost:8002/health

# Search Service
curl http://localhost:8004/health

# ElasticSearch
curl http://localhost:9200/_cluster/health
```

## Initialisation des bases de données

### Exécuter les migrations Alembic

```bash
# Pour le service auth
docker-compose exec auth alembic upgrade head

# Pour tous les services (si configuré)
make migrate-all
```

### Initialiser ElasticSearch

```bash
# Créer l'index candidates
docker-compose exec search python scripts/init_index.py
```

## Configuration des services

### MinIO - Créer le bucket

1. Accéder à http://localhost:9001
2. Se connecter avec `minioadmin` / `minioadmin123`
3. Créer un bucket nommé `documents`

### ElasticSearch - Vérifier l'index

```bash
# Lister les index
curl http://localhost:9200/_cat/indices

# Vérifier le mapping de l'index candidates
curl http://localhost:9200/candidates/_mapping
```

## Dépannage

### Service ne démarre pas

```bash
# Voir les logs détaillés
docker-compose logs service-name

# Vérifier les dépendances
docker-compose ps

# Redémarrer le service
docker-compose restart service-name
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Vérifier les logs PostgreSQL
docker-compose logs postgres

# Tester la connexion
docker-compose exec postgres psql -U postgres -d yemma_db
```

### Erreur de connexion à ElasticSearch

```bash
# Vérifier les logs
docker-compose logs elasticsearch

# Vérifier l'état du cluster
curl http://localhost:9200/_cluster/health?pretty
```

### Nettoyer et redémarrer

```bash
# Arrêter et supprimer les conteneurs (garde les volumes)
make clean

# Tout supprimer (y compris les volumes) ⚠️
make clean-all

# Rebuild et redémarrer
make build-up
```

## Commandes de développement

### Accéder au shell d'un service

```bash
# Auth service
docker-compose exec auth /bin/bash

# Candidate service
docker-compose exec candidate /bin/bash

# Ou avec Makefile
make shell-auth
```

### Exécuter des commandes dans un service

```bash
# Exécuter une migration
docker-compose exec auth alembic upgrade head

# Exécuter un script Python
docker-compose exec search python scripts/init_index.py

# Voir les variables d'environnement
docker-compose exec auth env
```

## Monitoring

### Voir les statistiques des conteneurs

```bash
docker stats
```

### Voir l'utilisation des volumes

```bash
docker volume ls | grep yemma
```

## Arrêt propre

```bash
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v
```

## URLs d'accès rapides

Une fois les services démarrés :

- **Frontend****: http://localhost:3000
- **Auth API**: http://localhost:8001/docs
- **Candidate API**: http://localhost:8002/docs
- **Search API**: http://localhost:8004/docs
- **Company API**: http://localhost:8005/docs
- **Payment API**: http://localhost:8006/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)
- **Kibana**: http://localhost:5601
- **ElasticSearch**: http://localhost:9200

## Prochaines étapes

1. ✅ Vérifier que tous les services sont `healthy`
2. ✅ Exécuter les migrations de base de données
3. ✅ Initialiser l'index ElasticSearch
4. ✅ Créer le bucket MinIO
5. ✅ Tester les endpoints avec les docs Swagger

