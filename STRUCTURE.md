# Structure du Projet

## Vue d'ensemble

```
yemma-solutions/
├── services/              # Services backend (microservices)
│   ├── auth/             # Service d'authentification
│   ├── candidate/        # Service de gestion des candidats
│   ├── admin/            # Service d'administration
│   └── shared/           # Code partagé entre services
├── frontend/             # Application React
├── docker-compose.yml    # Configuration Docker principale
├── .env.example          # Template des variables d'environnement
└── README.md            # Documentation principale
```

## Services Backend

### Auth Service (`services/auth/`)

Service d'authentification et de gestion des utilisateurs.

**Structure :**
```
services/auth/
├── app/
│   ├── main.py          # Point d'entrée FastAPI
│   └── core/
│       └── config.py    # Configuration
├── Dockerfile
├── requirements.txt
└── README.md
```

**Port :** 8001  
**Documentation :** http://localhost:8001/docs

### Candidate Service (`services/candidate/`)

Service de gestion des profils candidats.

**Structure :**
```
services/candidate/
├── app/
│   ├── main.py          # Point d'entrée FastAPI
│   └── core/
│       └── config.py    # Configuration
├── Dockerfile
├── requirements.txt
└── README.md
```

**Port :** 8002  
**Documentation :** http://localhost:8002/docs

### Admin Service (`services/admin/`)

Service d'administration et de validation des profils.

**Status :** À implémenter

### Shared Module (`services/shared/`)

Module partagé entre les services backend.

**Contenu :**
- Utilitaires communs
- Types et schémas partagés
- Clients pour services externes
- Constantes communes

## Frontend

### React App (`frontend/`)

Application React pour l'interface utilisateur.

**Structure :**
```
frontend/
├── src/
│   ├── App.jsx          # Composant principal
│   └── main.jsx         # Point d'entrée
├── package.json
├── vite.config.js       # Configuration Vite
├── Dockerfile
└── README.md
```

**Port :** 3000  
**URL :** http://localhost:3000

## Infrastructure

### PostgreSQL

Base de données principale partagée entre les services.

**Port :** 5432  
**Variables :** `DB_USER`, `DB_PASSWORD`, `DB_NAME`

### Redis

Cache et broker de messages.

**Port :** 6379  
**Variable :** `REDIS_PASSWORD`

## Configuration

### Variables d'environnement

Le fichier `.env` à la racine contient toutes les variables globales :

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres_password
DB_NAME=yemma_db

# JWT
JWT_SECRET_KEY=your-secret-key

# Redis
REDIS_PASSWORD=redis_password

# Ports
AUTH_PORT=8001
CANDIDATE_PORT=8002
FRONTEND_PORT=3000
```

**Important :** Copier `.env.example` vers `.env` et modifier les valeurs.

## Docker Compose

Le fichier `docker-compose.yml` à la racine orchestre tous les services :

- PostgreSQL
- Redis
- Auth Service
- Candidate Service
- Frontend

**Commandes :**
```bash
# Démarrer tous les services
docker-compose up -d

# Démarrer un service spécifique
docker-compose up auth

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

## Développement

### Backend

Chaque service peut être développé indépendamment :

```bash
cd services/auth
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Prochaines étapes

1. ✅ Structure de base créée
2. ⏳ Implémenter l'authentification complète
3. ⏳ Créer les endpoints candidats
4. ⏳ Développer l'interface React
5. ⏳ Ajouter les tests

