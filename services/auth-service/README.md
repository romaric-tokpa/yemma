# Auth Service

Service d'authentification et de gestion des utilisateurs pour la plateforme de recrutement Yemma Solutions.

## Architecture

Ce service suit une architecture hexagonale (Clean Architecture) :

```
app/
├── api/           # Couche API (endpoints FastAPI)
├── domain/        # Couche domaine (modèles, schémas, exceptions)
├── infrastructure/# Couche infrastructure (DB, sécurité, repositories)
└── core/          # Configuration et utilitaires centraux
```

## Fonctionnalités

- ✅ Authentification JWT OAuth2
- ✅ Inscription et connexion
- ✅ Gestion des rôles (RBAC)
- ✅ Refresh tokens
- ✅ Réinitialisation de mot de passe
- ✅ Gestion des utilisateurs
- ✅ Health check
- ✅ Gestion globale des erreurs

## Technologies

- **FastAPI** : Framework web asynchrone
- **SQLModel** : ORM combinant Pydantic et SQLAlchemy
- **Alembic** : Migrations de base de données
- **JWT** : Tokens d'authentification
- **PostgreSQL** : Base de données

## Installation

### Prérequis

- Python 3.11+
- PostgreSQL 15+
- Docker (optionnel)

### Installation locale

```bash
# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate

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
docker-compose -f docker/docker-compose.yml up auth-service
```

## Configuration

Les variables d'environnement sont gérées via Pydantic BaseSettings. Voir `env.example` pour la liste complète.

Variables importantes :
- `DATABASE_URL` : URL de connexion PostgreSQL
- `JWT_SECRET_KEY` : Clé secrète pour les tokens JWT
- `RABBITMQ_URL` : URL de connexion RabbitMQ

## Endpoints

### Authentication

- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/refresh` - Rafraîchir le token
- `POST /api/v1/auth/logout` - Déconnexion
- `POST /api/v1/auth/password-reset` - Demande de réinitialisation
- `POST /api/v1/auth/change-password` - Changer le mot de passe

### Users

- `GET /api/v1/users/me` - Informations de l'utilisateur connecté
- `GET /api/v1/users/{user_id}` - Récupérer un utilisateur (admin)
- `PUT /api/v1/users/me` - Mettre à jour son profil

### Health

- `GET /health` - Health check
- `GET /` - Root endpoint

## Documentation API

Une fois le service démarré, accédez à la documentation interactive :
- Swagger UI : http://localhost:8001/docs
- ReDoc : http://localhost:8001/redoc

## Migrations

```bash
# Créer une nouvelle migration
alembic revision --autogenerate -m "Description"

# Appliquer les migrations
alembic upgrade head

# Revenir en arrière
alembic downgrade -1
```

## Tests

```bash
# Exécuter les tests
pytest

# Avec couverture
pytest --cov=app
```

## Structure des rôles

- `ROLE_CANDIDAT` : Candidat
- `ROLE_COMPANY_ADMIN` : Administrateur d'entreprise
- `ROLE_RECRUITER` : Recruteur
- `ROLE_ADMIN` : Administrateur RH
- `ROLE_SUPER_ADMIN` : Super administrateur

## Sécurité

- Mots de passe hashés avec bcrypt
- Tokens JWT avec expiration
- Refresh tokens pour renouvellement
- Validation des données avec Pydantic
- Gestion des erreurs sécurisée

## Développement

### Hot Reload

Le service supporte le hot reload en développement :
```bash
uvicorn app.main:app --reload
```

### Logs

Les logs sont configurés via la variable `LOG_LEVEL` (DEBUG, INFO, WARNING, ERROR).

## Prochaines étapes

- [ ] Implémenter l'envoi d'emails (vérification, réinitialisation)
- [ ] Ajouter OAuth2 externe (LinkedIn, Google)
- [ ] Implémenter la gestion des sessions
- [ ] Ajouter des tests unitaires et d'intégration
- [ ] Intégration avec RabbitMQ pour les événements

