# Yemma Solutions - Plateforme de Recrutement

Plateforme de recrutement en microservices avec FastAPI (backend) et React (frontend).

## Structure du projet

```
yemma-solutions/
├── services/
│   ├── auth/          # Service d'authentification
│   ├── candidate/     # Service de gestion des candidats
│   ├── admin/         # Service d'administration
│   └── shared/        # Code partagé entre services
├── frontend/          # Application React
├── docker-compose.yml # Configuration Docker
└── .env              # Variables d'environnement (à créer)
```

## Prérequis

- Docker et Docker Compose
- Node.js 18+ (pour le développement frontend local)
- Python 3.11+ (pour le développement backend local)

## Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd yemma-solutions
```

### 2. Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env et modifier les valeurs (mots de passe, clés secrètes)
nano .env
```

**Important** : Modifiez au minimum :
- `DB_PASSWORD` : Mot de passe PostgreSQL
- `JWT_SECRET_KEY` : Clé secrète JWT (générer avec `openssl rand -hex 32`)
- `REDIS_PASSWORD` : Mot de passe Redis

### 3. Démarrer les services

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

## Services

### Backend Services

- **Auth Service** : http://localhost:8001
  - Documentation : http://localhost:8001/docs
  
- **Candidate Service** : http://localhost:8002
  - Documentation : http://localhost:8002/docs

### Frontend

- **React App** : http://localhost:3000

### Infrastructure

- **PostgreSQL** : localhost:5432
- **Redis** : localhost:6379

## Développement

### Backend (FastAPI)

```bash
# Se placer dans un service
cd services/auth

# Installer les dépendances
pip install -r requirements.txt

# Démarrer en mode développement
uvicorn app.main:app --reload --port 8001
```

### Frontend (React)

```bash
# Se placer dans le frontend
cd frontend

# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev
```

## Commandes Docker utiles

```bash
# Démarrer un service spécifique
docker-compose up auth

# Rebuild un service
docker-compose build auth

# Voir les logs d'un service
docker-compose logs -f auth

# Accéder au shell d'un conteneur
docker-compose exec auth /bin/bash

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v
```

## Structure des services

Chaque service backend suit cette structure :

```
service/
├── app/
│   ├── main.py          # Point d'entrée FastAPI
│   └── core/
│       └── config.py    # Configuration
├── Dockerfile
├── requirements.txt
└── README.md
```

## Variables d'environnement

Les variables d'environnement sont définies dans le fichier `.env` à la racine :

- `DB_USER`, `DB_PASSWORD`, `DB_NAME` : Configuration PostgreSQL
- `JWT_SECRET_KEY` : Clé secrète pour les tokens JWT
- `REDIS_PASSWORD` : Mot de passe Redis
- `AUTH_PORT`, `CANDIDATE_PORT`, `FRONTEND_PORT` : Ports des services

## Prochaines étapes

1. Implémenter l'authentification complète dans le service `auth`
2. Créer les endpoints pour la gestion des candidats
3. Développer l'interface React
4. Ajouter les tests unitaires et d'intégration
5. Configurer CI/CD

## Documentation

- [Architecture détaillée](./ARCHITECTURE.md)
- [Spécifications fonctionnelles](./specs.md)

## Licence

Propriétaire - Yemma Solutions

