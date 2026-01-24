# Yemma Solutions - Plateforme de Recrutement

Plateforme de recrutement moderne en microservices avec FastAPI (backend) et React (frontend), conçue pour connecter les entreprises aux meilleurs talents.

## 🎯 Vue d'ensemble

Yemma Solutions est une plateforme complète de recrutement qui permet :
- **Aux candidats** : De créer et gérer leur profil professionnel, de suivre leur processus de validation
- **Aux entreprises** : De rechercher et consulter des profils validés, de gérer leur équipe de recrutement
- **Aux administrateurs** : De valider les profils candidats, de gérer les entreprises et leurs abonnements

## 🏗️ Architecture

L'application suit une architecture microservices avec les services suivants :

### Services Backend

| Service | Port | Description |
|---------|------|-------------|
| **auth-service** | 8001 | Authentification, gestion des utilisateurs et rôles |
| **candidate-service** | 8002 | Gestion des profils candidats et onboarding |
| **admin-service** | 8009 | Validation et administration des profils |
| **company-service** | 8005 | Gestion des entreprises et recruteurs |
| **search-service** | 8004 | Recherche de profils avec Elasticsearch |
| **document-service** | 8003 | Stockage et gestion des documents (CV, etc.) |
| **payment-service** | 8006 | Gestion des abonnements et paiements Stripe |
| **notification-service** | 8007 | Envoi d'emails et notifications |
| **audit-service** | 8008 | Audit et conformité RGPD |

### Frontend

- **React App** : Application React moderne avec Vite (port 3000)

### Infrastructure

- **PostgreSQL** : Base de données principale (port 5432)
- **Redis** : Cache et sessions (port 6379)
- **Elasticsearch** : Moteur de recherche (port 9200)
- **MinIO/S3** : Stockage d'objets pour les documents (port 9000)
- **Nginx** : Reverse proxy et load balancer (port 80)

## 📋 Prérequis

- **Docker** et **Docker Compose** (recommandé)
- **Node.js** 18+ (pour le développement frontend local)
- **Python** 3.11+ (pour le développement backend local)
- **PostgreSQL** 15+ (si développement local sans Docker)
- **Elasticsearch** 8.x (si développement local sans Docker)

## 🚀 Installation rapide

### 1. Cloner le projet

```bash
git clone <repository-url>
cd yemma
```

### 2. Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer .env et modifier les valeurs essentielles
nano .env
```

**Variables essentielles à modifier :**
- `DB_PASSWORD` : Mot de passe PostgreSQL
- `JWT_SECRET_KEY` : Clé secrète JWT (générer avec `openssl rand -hex 32`)
- `REDIS_PASSWORD` : Mot de passe Redis
- `ELASTICSEARCH_PASSWORD` : Mot de passe Elasticsearch
- `STRIPE_SECRET_KEY` : Clé API Stripe (pour les paiements)
- `S3_ACCESS_KEY` et `S3_SECRET_KEY` : Clés d'accès MinIO/S3

### 3. Démarrer tous les services

```bash
# Démarrer tous les services avec Docker Compose
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f

# Vérifier le statut des services
docker-compose ps
```

### 4. Accéder à l'application

- **Frontend** : http://localhost:3000
- **API Documentation** : 
  - Auth Service : http://localhost:8001/docs
  - Candidate Service : http://localhost:8002/docs
  - Company Service : http://localhost:8005/docs
  - Search Service : http://localhost:8004/docs
  - Admin Service : http://localhost:8009/docs

## 📁 Structure du projet

```
yemma/
├── frontend/                 # Application React
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   ├── pages/           # Pages de l'application
│   │   ├── services/        # Clients API
│   │   └── utils/           # Utilitaires
│   └── package.json
├── services/                # Services backend
│   ├── auth-service/        # Authentification
│   ├── candidate-service/  # Profils candidats
│   ├── company-service/    # Entreprises et recruteurs
│   ├── admin-service/       # Administration
│   ├── search-service/      # Recherche Elasticsearch
│   ├── document-service/    # Gestion documents
│   ├── payment-service/     # Paiements Stripe
│   ├── notification-service/# Notifications email
│   ├── audit-service/       # Audit RGPD
│   └── shared/              # Code partagé
├── nginx/                   # Configuration Nginx
├── docker-compose.yml       # Orchestration Docker
├── .env                     # Variables d'environnement
└── README.md               # Ce fichier
```

## 🔧 Développement

### Backend (FastAPI)

Chaque service backend suit une architecture hexagonale :

```bash
# Se placer dans un service
cd services/auth-service

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

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

Le système utilise JWT (JSON Web Tokens) avec les rôles suivants :

- **ROLE_CANDIDAT** : Candidat inscrit sur la plateforme
- **ROLE_COMPANY_ADMIN** : Administrateur d'entreprise (compte maître)
- **ROLE_RECRUITER** : Recruteur membre d'une entreprise
- **ROLE_ADMIN** : Administrateur RH (validation des profils)
- **ROLE_SUPER_ADMIN** : Super administrateur (accès total)

## 📊 Fonctionnalités principales

### Pour les candidats
- ✅ Création de profil en plusieurs étapes
- ✅ Upload de documents (CV, diplômes, etc.)
- ✅ Suivi du statut de validation
- ✅ Gestion des compétences et expériences

### Pour les entreprises
- ✅ Recherche avancée de profils validés
- ✅ Filtres multiples (secteur, compétences, expérience, etc.)
- ✅ Gestion de l'équipe de recrutement
- ✅ Abonnements et quotas
- ✅ Consultation de profils avec avis experts

### Pour les administrateurs
- ✅ Validation/rejet de profils candidats
- ✅ Évaluation avec scores détaillés
- ✅ Gestion des entreprises
- ✅ Consultation des statistiques

## 🗄️ Base de données

Chaque service possède sa propre base de données PostgreSQL :
- `yemma_auth_db` : Utilisateurs et authentification
- `yemma_candidate_db` : Profils candidats
- `yemma_company_db` : Entreprises et recruteurs
- `yemma_admin_db` : Données d'administration
- `yemma_document_db` : Métadonnées des documents
- `yemma_payment_db` : Abonnements et paiements
- `yemma_notification_db` : Historique des notifications
- `yemma_audit_db` : Logs d'audit

## 🔍 Recherche

Le service de recherche utilise **Elasticsearch** avec :
- Indexation complète de tous les champs de profil
- Recherche full-text avec fuzzy search
- Filtres avancés (secteur, compétences, expérience, localisation, etc.)
- Synonymes pour les compétences et titres de postes
- Boosting intelligent selon la pertinence

## 💳 Paiements

Intégration **Stripe** pour les abonnements :
- **Freemium** : 10 consultations/mois, recherche limitée
- **Pro** : Consultations illimitées, recherche illimitée
- **Enterprise** : Tout Pro + accès documents + multi-comptes

## 📧 Notifications

Service de notification avec support de plusieurs providers :
- SMTP (Gmail, etc.)
- SendGrid
- Mailgun

Templates d'emails pour :
- Validation de profil
- Actions requises
- Invitations recruteurs
- Notifications d'entreprise

## 🐳 Commandes Docker utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Démarrer un service spécifique
docker-compose up -d auth-service

# Rebuild un service après modification
docker-compose build auth-service
docker-compose up -d auth-service

# Voir les logs d'un service
docker-compose logs -f auth-service

# Accéder au shell d'un conteneur
docker-compose exec auth-service /bin/bash

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v

# Voir l'utilisation des ressources
docker stats
```

## 🧪 Tests

### Backend

```bash
# Depuis la racine du projet
cd tests/backend

# Exécuter tous les tests
pytest

# Exécuter les tests d'un service spécifique
pytest test_candidate_service.py

# Avec couverture
pytest --cov=services/candidate/app
```

### Frontend

```bash
cd frontend

# Exécuter les tests
npm test

# Avec couverture
npm run test:coverage
```

## 📝 Variables d'environnement

Les variables d'environnement sont définies dans le fichier `.env` à la racine. Voir `env.example` pour la liste complète.

**Variables importantes :**
- `DB_*` : Configuration PostgreSQL
- `JWT_SECRET_KEY` : Clé secrète pour les tokens JWT
- `REDIS_*` : Configuration Redis
- `ELASTICSEARCH_*` : Configuration Elasticsearch
- `STRIPE_*` : Configuration Stripe
- `S3_*` : Configuration MinIO/S3
- `EMAIL_*` : Configuration email

## 🚀 Déploiement

### Production

1. Configurer les variables d'environnement de production
2. Utiliser des secrets managers (AWS Secrets Manager, HashiCorp Vault, etc.)
3. Configurer HTTPS avec certificats SSL
4. Configurer les backups de base de données
5. Mettre en place la surveillance et les alertes

### CI/CD

Le projet peut être intégré avec :
- GitHub Actions
- GitLab CI/CD
- Jenkins
- CircleCI

## 📚 Documentation

- [Architecture détaillée](./ARCHITECTURE.md) (à créer)
- [Guide de développement](./DEVELOPMENT.md) (à créer)
- [Documentation API](http://localhost:8001/docs) (Swagger UI)
- [Documentation des services](./services/) (README de chaque service)

## 🤝 Contribution

1. Créer une branche depuis `main`
2. Développer la fonctionnalité
3. Ajouter les tests
4. Créer une Pull Request

## 📄 Licence

Propriétaire - Yemma Solutions © 2024

## 🆘 Support

Pour toute question ou problème :
- Créer une issue sur le repository
- Contacter l'équipe de développement

## 🔄 Changelog

Voir les [releases](../../releases) pour l'historique des versions.

---

**Développé avec ❤️ par l'équipe Yemma Solutions**
