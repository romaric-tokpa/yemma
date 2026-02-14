# Yemma Solutions - Plateforme de Recrutement

Plateforme de recrutement moderne en microservices avec FastAPI (backend) et React (frontend), conçue pour connecter les entreprises aux meilleurs talents.

## 🎯 Vue d'ensemble

Yemma Solutions est une plateforme complète de recrutement qui permet :
- **Aux candidats** : De créer et gérer leur profil professionnel, de suivre leur processus de validation
- **Aux entreprises** : De rechercher et consulter des profils validés, de gérer leur équipe de recrutement
- **Aux administrateurs** : De valider les profils candidats, de gérer les entreprises et leurs abonnements

## 🏗️ Architecture

L'application suit une architecture **microservices** avec **Database per Service** : chaque service possède sa propre base PostgreSQL.

### Services Backend

| Service | Description |
|---------|-------------|
| **auth** | Authentification, gestion des utilisateurs et rôles (JWT, OAuth) |
| **candidate** | Gestion des profils candidats et onboarding |
| **company** | Gestion des entreprises et recruteurs |
| **admin** | Validation et administration des profils |
| **search** | Recherche de profils avec Elasticsearch |
| **document** | Stockage et gestion des documents (CV, etc.) |
| **payment** | Gestion des abonnements et paiements Stripe |
| **notification** | Envoi d'emails et notifications (Celery) |
| **audit** | Logs d'accès et conformité RGPD |
| **parsing** | Parsing de CV via HRFlow.ai |

### Frontend

- **React App** : Application React avec Vite, TailwindCSS, Radix UI (port 3000)

### Infrastructure

- **Nginx** : API Gateway et reverse proxy (port 80)
- **PostgreSQL** : 6 instances (auth_db, candidate_db, company_db, payment_db, document_db, logs_db)
- **Redis** : Cache, sessions et broker Celery (port 6379)
- **Elasticsearch** : Moteur de recherche (port 9200)
- **MinIO** : Stockage S3-compatible pour les documents (port 9000)
- **Kibana** : Visualisation Elasticsearch (port 5601)

## 📋 Prérequis

- **Docker** et **Docker Compose**
- **Node.js** 18+ (développement frontend local)
- **Python** 3.11+ (développement backend local)

## 🚀 Installation rapide

### 1. Cloner le projet

```bash
git clone <repository-url>
cd yemma
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
# Éditer .env et modifier les valeurs essentielles
```

**Variables essentielles :**
- `DB_USER`, `DB_PASSWORD` : PostgreSQL
- `JWT_SECRET_KEY` : Clé JWT (`openssl rand -hex 32`)
- `REDIS_PASSWORD` : Redis
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` : Paiements
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` : Stockage

### 3. Première installation (bases vides)

Pour une **nouvelle installation** sans données existantes :

```bash
# 1. Démarrer l'infrastructure
docker-compose up -d postgres-auth postgres-candidate postgres-company postgres-payment postgres-document postgres-logs redis elasticsearch minio
docker-compose ps   # Attendre que tout soit healthy

# 2. Migrations Alembic (candidate)
docker-compose run --rm -e PYTHONPATH= candidate alembic -c /app/alembic.ini upgrade head

# 3. Démarrer les services (company, payment, document, notification, audit créent leurs tables au démarrage)
docker-compose up -d
```

### 4. Migration depuis une base existante

Si vous migrez depuis l'ancienne architecture (base unique `yemma_db`), suivez le guide détaillé :

📄 **[MIGRATION_DATABASE_PER_SERVICE.md](./MIGRATION_DATABASE_PER_SERVICE.md)**

### 5. Accéder à l'application

- **Frontend** : http://localhost:3000 (ou via Nginx sur le port 80)
- **API Documentation** (via Nginx) :
  - Auth : http://localhost/api/v1/auth/docs
  - Candidate : http://localhost/api/v1/profiles (Swagger dans le service)
  - Company : http://localhost/api/v1/companies
  - Search : http://localhost/api/v1/search
  - Admin : http://localhost/api/v1/admin

## 📁 Structure du projet

```
yemma/
├── frontend/                 # Application React (Vite)
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   ├── pages/            # Pages de l'application
│   │   ├── layouts/          # Layouts par rôle
│   │   └── routes/           # Configuration des routes
│   └── package.json
├── services/                 # Services backend
│   ├── auth-service/         # Authentification
│   ├── candidate/            # Profils candidats
│   ├── company/              # Entreprises et recruteurs
│   ├── admin/                # Administration
│   ├── search/               # Recherche Elasticsearch
│   ├── document/             # Gestion documents
│   ├── payment/              # Paiements Stripe
│   ├── notification/         # Notifications email
│   ├── audit/                # Audit RGPD
│   ├── yemma-parsing-service/# Parsing CV (HRFlow.ai)
│   └── shared/               # Module partagé (internal_auth, audit_logger)
├── nginx/                    # Configuration API Gateway
├── docker-compose.yml        # Orchestration Docker
├── MIGRATION_DATABASE_PER_SERVICE.md  # Guide de migration
└── README.md
```

## 🔧 Développement

### Build des services (module shared)

Les services `document`, `search`, `payment`, `notification` et `audit` utilisent le module partagé `shared`. Le build utilise le contexte `./services` :

```bash
# Rebuild un service après modification
docker-compose build --no-cache audit
docker-compose up -d audit
```

### Backend (FastAPI)

```bash
cd services/auth-service   # ou candidate, company, etc.
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

### Structure d'un service backend

```
service/
├── app/
│   ├── main.py              # Point d'entrée FastAPI
│   ├── api/v1/              # Endpoints API
│   ├── core/                # Configuration et exceptions
│   ├── domain/              # Modèles et schémas métier
│   └── infrastructure/      # Base de données, clients externes
├── Dockerfile
├── requirements.txt
└── README.md
```

## 🔐 Authentification et rôles

- **ROLE_CANDIDAT** : Candidat inscrit
- **ROLE_COMPANY_ADMIN** : Administrateur d'entreprise
- **ROLE_RECRUITER** : Recruteur membre d'une entreprise
- **ROLE_ADMIN** : Administrateur RH (validation des profils)
- **ROLE_SUPER_ADMIN** : Super administrateur

## 📊 Fonctionnalités principales

### Candidats
- Création de profil (onboarding avec upload CV)
- Gestion des compétences, expériences, formations
- Suivi du statut de validation

### Entreprises
- Recherche avancée de profils validés
- Gestion de l'équipe de recrutement
- Abonnements Stripe (Freemium, Pro, Enterprise)
- Consultation de profils avec audit RGPD

### Administrateurs
- Validation/rejet de profils candidats
- Évaluation avec scores détaillés
- Gestion des invitations admin

## 🗄️ Base de données (Database per Service)

| Base | Service(s) | Tables principales |
|------|------------|---------------------|
| auth_db | auth | users, roles, user_roles, refresh_tokens |
| candidate_db | candidate | profiles, experiences, educations, skills, job_preferences |
| company_db | company | companies, team_members, invitations |
| payment_db | payment | plans, subscriptions, payments, invoices, quotas |
| document_db | document | documents |
| logs_db | notification, audit | notifications, access_logs |

## 🐳 Commandes Docker utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Démarrer un service spécifique
docker-compose up -d auth candidate

# Rebuild un service (après modification du code ou Dockerfile)
docker-compose build --no-cache audit
docker-compose up -d audit

# Voir les logs
docker-compose logs -f auth

# Accéder au shell d'un conteneur
docker-compose exec auth /bin/bash

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v
```

## 🔧 Dépannage déploiement

### Erreur "password authentication failed for user postgres"

Si les services (auth, candidate, etc.) ne peuvent pas se connecter à PostgreSQL :

1. **Vérifier la cohérence** : `DB_USER` et `DB_PASSWORD` doivent être identiques dans le `.env` et utilisés par les conteneurs `postgres-*` et les services. Le `docker-compose.yml` utilise `${DB_PASSWORD:-postgres}` partout par défaut.

2. **Corriger le `.env`** sur le VPS :
   ```bash
   # /opt/yemma/.env
   DB_USER=postgres
   DB_PASSWORD=postgres   # ou votre mot de passe, mais identique partout
   ```

3. **Réinitialiser les volumes** si la base a été créée avec un ancien mot de passe :
   ```bash
   cd /opt/yemma
   docker compose -f docker-compose.yml -f docker-compose.prod.yml down
   docker volume rm yemma_postgres_auth_data yemma_postgres_candidate_data yemma_postgres_company_data yemma_postgres_payment_data yemma_postgres_document_data yemma_postgres_logs_data 2>/dev/null || true
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```
   *(Les noms de volumes peuvent varier : `docker volume ls` pour les lister.)*

4. **Vérifier les logs** :
   ```bash
   docker compose logs auth --tail=20
   ```

### Erreur 404 / MIME type (text/html pour .css)

Si vous voyez une erreur **MIME type ('text/html')** pour les fichiers `.css` ou `.js` :

1. **Vérifier que le frontend répond** (depuis le VPS) :
   ```bash
   docker exec yemma-nginx wget -qO- http://frontend:3000/ | head -5
   ```

2. **Vérifier les fichiers dans le conteneur frontend** :
   ```bash
   docker exec yemma-frontend ls -la /usr/share/nginx/html/assets/
   ```

3. **Redémarrer nginx** après modification de la config :
   ```bash
   docker compose restart nginx
   ```

L'API Gateway (nginx) proxyfie toutes les requêtes `/` vers le conteneur `frontend` qui sert les fichiers statiques.

## 📚 Documentation

- [Guide de migration Database per Service](./MIGRATION_DATABASE_PER_SERVICE.md)
- [Documentation des services](./services/) (README de chaque service)
- Swagger UI : disponible sur chaque service (voir nginx pour les routes)

## 📄 Licence

Propriétaire - Yemma Solutions © 2024

---

**Développé avec ❤️ par l'équipe Yemma Solutions**
