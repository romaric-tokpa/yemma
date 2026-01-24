# Auth Service

Service d'authentification et de gestion des utilisateurs pour la plateforme de recrutement Yemma Solutions.

## 🎯 Vue d'ensemble

Le service auth gère l'authentification, l'autorisation et la gestion des utilisateurs pour toute la plateforme. Il suit une architecture hexagonale (Clean Architecture) pour une séparation claire des responsabilités.

## ✨ Fonctionnalités

- ✅ Authentification JWT OAuth2
- ✅ Inscription et connexion sécurisées
- ✅ Gestion des rôles (RBAC) avec 5 rôles
- ✅ Refresh tokens pour renouvellement automatique
- ✅ Réinitialisation de mot de passe
- ✅ Changement de mot de passe
- ✅ Gestion complète des utilisateurs
- ✅ Health check et monitoring
- ✅ Gestion globale des erreurs
- ✅ Validation des données avec Pydantic

## 🏗️ Architecture

Architecture hexagonale (Clean Architecture) :

```
app/
├── api/              # Couche API (endpoints FastAPI)
│   └── v1/
│       ├── auth.py   # Endpoints d'authentification
│       └── users.py  # Endpoints utilisateurs
├── domain/           # Couche domaine (logique métier)
│   ├── models.py     # Modèles SQLModel
│   └── schemas.py    # Schémas Pydantic
├── infrastructure/   # Couche infrastructure
│   ├── database.py   # Configuration DB
│   └── security.py   # Sécurité (JWT, hash)
└── core/             # Configuration et utilitaires
    ├── config.py     # Configuration
    └── exceptions.py # Gestion des erreurs
```

## 🛠️ Technologies

- **FastAPI** : Framework web asynchrone haute performance
- **SQLModel** : ORM combinant Pydantic et SQLAlchemy
- **Alembic** : Migrations de base de données
- **JWT** : Tokens d'authentification (PyJWT)
- **bcrypt** : Hashage sécurisé des mots de passe
- **PostgreSQL** : Base de données relationnelle

## 📊 Modèle de données

### User

Modèle principal représentant un utilisateur :

- `id` : ID unique
- `email` : Email (unique, indexé)
- `hashed_password` : Mot de passe hashé avec bcrypt
- `first_name` : Prénom (optionnel)
- `last_name` : Nom (optionnel)
- `roles` : Liste des rôles (JSON array)
- `is_active` : Statut actif/inactif
- `is_verified` : Statut de vérification email
- `created_at` : Date de création
- `updated_at` : Date de mise à jour
- `last_login` : Dernière connexion

## 🚀 Endpoints

### Authentification

#### POST /api/v1/auth/register

Inscription d'un nouvel utilisateur.

**Body :**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "Jean",
  "last_name": "Dupont",
  "role": "ROLE_CANDIDAT"
}
```

**Réponse :**
```json
{
  "message": "User registered successfully",
  "user_id": 123
}
```

#### POST /api/v1/auth/login

Connexion d'un utilisateur.

**Body :**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "roles": ["ROLE_CANDIDAT"]
  }
}
```

#### POST /api/v1/auth/refresh

Rafraîchir le token d'accès.

**Body :**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/v1/auth/logout

Déconnexion (invalidation du refresh token).

#### POST /api/v1/auth/password-reset

Demande de réinitialisation de mot de passe.

**Body :**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/v1/auth/password-reset/confirm

Confirmer la réinitialisation avec token.

**Body :**
```json
{
  "token": "reset_token_here",
  "new_password": "NewSecurePassword123!"
}
```

#### POST /api/v1/auth/change-password

Changer le mot de passe (utilisateur connecté).

**Body :**
```json
{
  "old_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

### Utilisateurs

#### GET /api/v1/users/me

Récupère les informations de l'utilisateur connecté.

**Permissions** : Utilisateur authentifié

#### GET /api/v1/users/{user_id}

Récupère un utilisateur par ID (admin uniquement).

**Permissions** : ROLE_ADMIN ou ROLE_SUPER_ADMIN

#### PUT /api/v1/users/me

Met à jour le profil de l'utilisateur connecté.

**Body :**
```json
{
  "first_name": "Jean",
  "last_name": "Dupont"
}
```

#### GET /api/v1/users/internal/{user_id}

Endpoint interne pour récupérer un utilisateur (utilisé par d'autres services).

**Permissions** : Token de service interne

### Health

#### GET /health

Health check du service.

**Réponse :**
```json
{
  "status": "healthy",
  "service": "auth-service",
  "version": "1.0.0"
}
```

## 🔐 Rôles et permissions

Le système utilise 5 rôles principaux :

| Rôle | Description | Accès |
|------|-------------|-------|
| **ROLE_CANDIDAT** | Candidat inscrit | Création et gestion de profil |
| **ROLE_COMPANY_ADMIN** | Admin d'entreprise | Gestion complète de l'entreprise |
| **ROLE_RECRUITER** | Recruteur | Recherche et consultation de profils |
| **ROLE_ADMIN** | Admin RH | Validation des profils candidats |
| **ROLE_SUPER_ADMIN** | Super admin | Accès total à la plateforme |

## 🔒 Sécurité

### Mots de passe
- Hashage avec **bcrypt** (12 rounds)
- Validation de force (min 8 caractères, recommandé : majuscules, minuscules, chiffres, symboles)
- Pas de stockage en clair

### Tokens JWT
- **Access Token** : Durée de vie courte (1 heure par défaut)
- **Refresh Token** : Durée de vie longue (7 jours par défaut)
- Signature avec algorithme HS256
- Validation stricte des tokens

### Protection des endpoints
- Middleware d'authentification sur toutes les routes protégées
- Validation des rôles pour les actions sensibles
- Rate limiting (à implémenter)

## ⚙️ Configuration

Variables d'environnement :

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/yemma_auth_db

# JWT
JWT_SECRET_KEY=your-secret-key-here-min-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Application
APP_NAME=Auth Service
APP_VERSION=1.0.0
DEBUG=false
LOG_LEVEL=INFO

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:80
```

## 🛠️ Développement

### Installation locale

```bash
# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Exécuter les migrations
alembic upgrade head

# Démarrer le service
uvicorn app.main:app --reload --port 8001
```

### Installation avec Docker

```bash
# Depuis la racine du projet
docker-compose up auth-service

# Voir les logs
docker-compose logs -f auth-service
```

## 📊 Migrations

### Créer une nouvelle migration

```bash
# Générer une migration automatique
alembic revision --autogenerate -m "Description de la migration"

# Créer une migration vide
alembic revision -m "Description de la migration"
```

### Appliquer les migrations

```bash
# Appliquer toutes les migrations en attente
alembic upgrade head

# Revenir en arrière d'une migration
alembic downgrade -1

# Voir l'historique
alembic history
```

## 🧪 Tests

```bash
# Exécuter tous les tests
pytest

# Exécuter avec couverture
pytest --cov=app --cov-report=html

# Exécuter un test spécifique
pytest tests/test_auth.py::test_login

# Mode verbose
pytest -v
```

## 📚 Documentation API

Une fois le service démarré, accédez à la documentation interactive :

- **Swagger UI** : http://localhost:8001/docs
- **ReDoc** : http://localhost:8001/redoc

## 🔄 Intégration avec autres services

### Services qui utilisent auth-service

- **Candidate Service** : Validation JWT pour les profils
- **Company Service** : Validation JWT pour les entreprises
- **Admin Service** : Validation JWT pour l'administration
- **Search Service** : Validation JWT pour la recherche

### Appels internes

Les services peuvent appeler auth-service avec un token de service pour :
- Récupérer les informations d'un utilisateur
- Vérifier l'existence d'un utilisateur
- Valider un token JWT

## 🐛 Dépannage

### Erreur de connexion à la base de données

Vérifier que PostgreSQL est démarré et que les credentials sont corrects :
```bash
psql -h localhost -U postgres -d yemma_auth_db
```

### Erreur JWT

Vérifier que `JWT_SECRET_KEY` est défini et fait au moins 32 caractères.

### Erreur de migration

```bash
# Vérifier l'état des migrations
alembic current

# Appliquer les migrations manquantes
alembic upgrade head
```

## 🚀 Prochaines étapes

- [ ] Implémenter l'envoi d'emails (vérification, réinitialisation)
- [ ] Ajouter OAuth2 externe (LinkedIn, Google)
- [ ] Implémenter la gestion des sessions
- [ ] Ajouter le rate limiting
- [ ] Implémenter la 2FA (authentification à deux facteurs)
- [ ] Ajouter l'audit des connexions
- [ ] Implémenter le lockout de compte après tentatives échouées

## 📖 Ressources

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com)
- [Alembic Documentation](https://alembic.sqlalchemy.org)
- [JWT.io](https://jwt.io) - Décoder et tester les tokens JWT

---

**Service développé pour Yemma Solutions**
