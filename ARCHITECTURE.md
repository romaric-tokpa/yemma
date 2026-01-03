# Architecture Microservices - Plateforme de Recrutement

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Arborescence complète](#arborescence-complète)
3. [Rôles et responsabilités par service](#rôles-et-responsabilités-par-service)
4. [Conventions de nommage](#conventions-de-nommage)
5. [Communication inter-services](#communication-inter-services)
6. [Stack technologique](#stack-technologique)

---

## Vue d'ensemble

Cette plateforme de recrutement est construite selon une architecture microservices en monorepo, permettant une scalabilité indépendante de chaque service, une maintenance facilitée et une évolution progressive.

### Principes architecturaux
- **Séparation des responsabilités** : Chaque service a une responsabilité métier unique
- **Autonomie** : Chaque service possède sa propre base de données
- **Communication asynchrone** : Utilisation de RabbitMQ pour les événements métier
- **API Gateway** : Point d'entrée unique pour toutes les requêtes externes
- **Sécurité centralisée** : Service Auth comme source de vérité pour l'authentification

---

## Arborescence complète

```
yemma-solutions/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   └── nginx/
│       └── nginx.conf
├── services/
│   ├── api-gateway/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── middleware/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py
│   │   │   │   └── rate_limiting.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       └── proxy.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── README.md
│   │
│   ├── auth-service/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user.py
│   │   │   │   └── role.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py
│   │   │   │   └── user.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── auth.py
│   │   │   │   │   └── users.py
│   │   │   │   └── dependencies.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── security.py
│   │   │   │   ├── jwt.py
│   │   │   │   └── oauth2.py
│   │   │   ├── db/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── session.py
│   │   │   │   └── migrations/
│   │   │   │       └── versions/
│   │   │   └── services/
│   │   │       ├── __init__.py
│   │   │       ├── auth_service.py
│   │   │       └── user_service.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   ├── test_auth.py
│   │   │   └── conftest.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── alembic.ini
│   │   └── README.md
│   │
│   ├── candidate-service/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── profile.py
│   │   │   │   ├── experience.py
│   │   │   │   ├── education.py
│   │   │   │   ├── certification.py
│   │   │   │   └── skill.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── profile.py
│   │   │   │   ├── experience.py
│   │   │   │   └── onboarding.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── profiles.py
│   │   │   │   │   └── onboarding.py
│   │   │   │   └── dependencies.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   └── events.py
│   │   │   ├── db/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── session.py
│   │   │   │   └── migrations/
│   │   │   │       └── versions/
│   │   │   └── services/
│   │   │       ├── __init__.py
│   │   │       ├── profile_service.py
│   │   │       └── onboarding_service.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   └── test_profiles.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── alembic.ini
│   │   └── README.md
│   │
│   ├── document-service/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   └── document.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   └── document.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   └── documents.py
│   │   │   │   └── dependencies.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── storage.py
│   │   │   │   ├── antivirus.py
│   │   │   │   └── encryption.py
│   │   │   ├── db/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── session.py
│   │   │   │   └── migrations/
│   │   │   │       └── versions/
│   │   │   └── services/
│   │   │       ├── __init__.py
│   │   │       └── document_service.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   └── test_documents.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── alembic.ini
│   │   └── README.md
│   │
│   ├── admin-service/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── validation.py
│   │   │   │   ├── interview.py
│   │   │   │   └── assessment.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── validation.py
│   │   │   │   └── interview.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── validations.py
│   │   │   │   │   └── interviews.py
│   │   │   │   └── dependencies.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   └── workflow.py
│   │   │   ├── db/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── session.py
│   │   │   │   └── migrations/
│   │   │   │       └── versions/
│   │   │   └── services/
│   │   │       ├── __init__.py
│   │   │       ├── validation_service.py
│   │   │       └── interview_service.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   └── test_validations.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── alembic.ini
│   │   └── README.md
│   │
│   ├── company-service/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── company.py
│   │   │   │   └── recruiter.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── company.py
│   │   │   │   └── recruiter.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── companies.py
│   │   │   │   │   └── recruiters.py
│   │   │   │   └── dependencies.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   └── events.py
│   │   │   ├── db/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── session.py
│   │   │   │   └── migrations/
│   │   │   │       └── versions/
│   │   │   └── services/
│   │   │       ├── __init__.py
│   │   │       ├── company_service.py
│   │   │       └── recruiter_service.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   └── test_companies.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── alembic.ini
│   │   └── README.md
│   │
│   ├── search-service/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   └── search.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   └── search.py
│   │   │   │   └── dependencies.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── indexer.py
│   │   │   │   └── searcher.py
│   │   │   └── services/
│   │   │       ├── __init__.py
│   │   │       └── search_service.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   └── test_search.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── README.md
│   │
│   ├── subscription-service/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── plan.py
│   │   │   │   └── subscription.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── plan.py
│   │   │   │   └── subscription.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── plans.py
│   │   │   │   │   └── subscriptions.py
│   │   │   │   └── dependencies.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   └── quota.py
│   │   │   ├── db/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── session.py
│   │   │   │   └── migrations/
│   │   │   │       └── versions/
│   │   │   └── services/
│   │   │       ├── __init__.py
│   │   │       └── subscription_service.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   └── test_subscriptions.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── alembic.ini
│   │   └── README.md
│   │
│   ├── payment-service/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payment.py
│   │   │   │   └── invoice.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payment.py
│   │   │   │   └── invoice.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── payments.py
│   │   │   │   │   └── invoices.py
│   │   │   │   └── dependencies.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payment_gateway.py
│   │   │   │   └── invoice_generator.py
│   │   │   ├── db/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── session.py
│   │   │   │   └── migrations/
│   │   │   │       └── versions/
│   │   │   └── services/
│   │   │       ├── __init__.py
│   │   │       └── payment_service.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   └── test_payments.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── alembic.ini
│   │   └── README.md
│   │
│   ├── notification-service/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   └── notification.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   └── notifications.py
│   │   │   │   └── dependencies.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── email.py
│   │   │   │   └── templates/
│   │   │   │       ├── email/
│   │   │   │       │   ├── validation.html
│   │   │   │       │   ├── rejection.html
│   │   │   │       │   └── welcome.html
│   │   │   │       └── in_app/
│   │   │   ├── consumers/
│   │   │   │   ├── __init__.py
│   │   │   │   └── notification_consumer.py
│   │   │   └── services/
│   │   │       ├── __init__.py
│   │   │       └── notification_service.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   └── test_notifications.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── README.md
│   │
│   └── audit-service/
│       ├── app/
│       │   ├── __init__.py
│       │   ├── main.py
│       │   ├── config.py
│       │   ├── models/
│       │   │   ├── __init__.py
│       │   │   └── audit_log.py
│       │   ├── schemas/
│       │   │   ├── __init__.py
│       │   │   └── audit.py
│       │   ├── api/
│       │   │   ├── __init__.py
│       │   │   ├── v1/
│       │   │   │   ├── __init__.py
│       │   │   │   └── audit.py
│       │   │   └── dependencies.py
│       │   ├── core/
│       │   │   ├── __init__.py
│       │   │   └── logger.py
│       │   ├── consumers/
│       │   │   ├── __init__.py
│       │   │   └── audit_consumer.py
│       │   ├── db/
│       │   │   ├── __init__.py
│       │   │   ├── base.py
│       │   │   ├── session.py
│       │   │   └── migrations/
│       │   │       └── versions/
│       │   └── services/
│       │       ├── __init__.py
│       │       └── audit_service.py
│       ├── tests/
│       │   ├── __init__.py
│       │   └── test_audit.py
│       ├── Dockerfile
│       ├── requirements.txt
│       ├── alembic.ini
│       └── README.md
│
├── shared/
│   ├── __init__.py
│   ├── common/
│   │   ├── __init__.py
│   │   ├── exceptions.py
│   │   ├── constants.py
│   │   ├── enums.py
│   │   └── utils.py
│   ├── messaging/
│   │   ├── __init__.py
│   │   ├── rabbitmq.py
│   │   ├── events.py
│   │   └── consumers.py
│   ├── database/
│   │   ├── __init__.py
│   │   └── base.py
│   └── auth/
│       ├── __init__.py
│       ├── jwt.py
│       └── permissions.py
│
├── scripts/
│   ├── init_db.sh
│   ├── migrate.sh
│   ├── seed_data.sh
│   └── health_check.sh
│
├── docs/
│   ├── api/
│   │   └── openapi.yaml
│   ├── architecture/
│   │   └── diagrams/
│   └── deployment/
│       └── kubernetes/
│
├── .env.example
├── .gitignore
├── .dockerignore
├── Makefile
├── README.md
├── ARCHITECTURE.md
└── specs.md
```

---

## Rôles et responsabilités par service

### 1. API Gateway (`api-gateway`)
**Rôle** : Point d'entrée unique pour toutes les requêtes clientes

**Responsabilités** :
- Routage des requêtes vers les microservices appropriés
- Authentification et autorisation centralisée (vérification JWT)
- Rate limiting et protection contre les abus
- Load balancing entre instances de services
- Aggrégation de réponses de plusieurs services si nécessaire
- Gestion des CORS
- Logging des requêtes entrantes

**Endpoints exposés** :
- `/api/v1/auth/*` → `auth-service`
- `/api/v1/candidates/*` → `candidate-service`
- `/api/v1/companies/*` → `company-service`
- `/api/v1/search/*` → `search-service`
- `/api/v1/admin/*` → `admin-service`
- `/api/v1/documents/*` → `document-service`
- `/api/v1/subscriptions/*` → `subscription-service`
- `/api/v1/payments/*` → `payment-service`
- `/api/v1/notifications/*` → `notification-service`
- `/api/v1/audit/*` → `audit-service`

---

### 2. Auth Service (`auth-service`)
**Rôle** : Gestion de l'identité et de l'accès (IAM)

**Responsabilités** :
- Inscription des utilisateurs (candidats, entreprises)
- Authentification (login, OAuth2, JWT)
- Gestion des rôles et permissions (RBAC)
- Réinitialisation de mot de passe
- Gestion des sessions et tokens
- Validation des tokens JWT pour les autres services
- Journalisation des connexions

**Base de données** :
- Table `users` : Informations d'authentification
- Table `roles` : Définition des rôles
- Table `user_roles` : Association utilisateurs-rôles
- Table `refresh_tokens` : Tokens de rafraîchissement

**Événements publiés** :
- `user.created`
- `user.updated`
- `user.deleted`
- `user.role_changed`

**Événements consommés** :
- Aucun (service source de vérité)

---

### 3. Candidate Service (`candidate-service`)
**Rôle** : Gestion des profils candidats

**Responsabilités** :
- Création et mise à jour des profils candidats
- Gestion du processus d'onboarding (étapes 0-8)
- Calcul de la jauge de complétion du profil
- Gestion des statuts de profil (DRAFT, SUBMITTED, IN_REVIEW, VALIDATED, REJECTED)
- Gestion des expériences professionnelles
- Gestion des formations et certifications
- Gestion des compétences (techniques, comportementales, outils)
- Gestion des préférences de recherche d'emploi
- Sauvegarde automatique du profil

**Base de données** :
- Table `profiles` : Profils candidats
- Table `experiences` : Expériences professionnelles
- Table `educations` : Formations
- Table `certifications` : Certifications
- Table `skills` : Compétences
- Table `job_preferences` : Préférences de recherche

**Événements publiés** :
- `profile.created`
- `profile.updated`
- `profile.submitted`
- `profile.status_changed`

**Événements consommés** :
- `profile.validated` (depuis admin-service)
- `profile.rejected` (depuis admin-service)

---

### 4. Document Service (`document-service`)
**Rôle** : Gestion sécurisée des documents

**Responsabilités** :
- Upload et stockage sécurisé des fichiers (CV, attestations, certificats)
- Scan antivirus des fichiers uploadés
- Chiffrement des documents au repos
- Génération de liens temporaires sécurisés pour consultation
- Gestion des métadonnées des documents
- Validation des formats et tailles de fichiers
- Prévisualisation des documents (PDF, images)
- Archivage des documents

**Base de données** :
- Table `documents` : Métadonnées des documents
- Table `document_access` : Logs d'accès aux documents

**Stockage** :
- S3/MinIO pour le stockage physique
- Chiffrement au repos (AES-256)

**Événements publiés** :
- `document.uploaded`
- `document.scanned`
- `document.accessed`

**Événements consommés** :
- `document.upload.requested` (depuis candidate-service)

---

### 5. Admin Service (`admin-service`)
**Rôle** : Workflow de validation et évaluation des profils

**Responsabilités** :
- Gestion de la file de préqualification
- Interface de validation des profils (split screen)
- Vérification des documents fournis
- Gestion des entretiens (planification, comptes rendus)
- Rédaction des grilles d'évaluation
- Décision de validation ou refus
- Gestion des statuts de validation
- Archivage des profils refusés

**Base de données** :
- Table `validations` : Historique des validations
- Table `interviews` : Entretiens planifiés et réalisés
- Table `assessments` : Grilles d'évaluation
- Table `rejected_profiles` : Profils refusés (soft delete)

**Événements publiés** :
- `profile.validated`
- `profile.rejected`
- `interview.scheduled`
- `interview.completed`
- `document.verification.requested`

**Événements consommés** :
- `profile.submitted` (depuis candidate-service)
- `document.uploaded` (depuis document-service)

---

### 6. Company Service (`company-service`)
**Rôle** : Gestion des entreprises et équipes recruteurs

**Responsabilités** :
- Création et gestion des comptes entreprises
- Gestion des équipes recruteurs (invitations, permissions)
- Association recruteurs-entreprises
- Gestion des informations légales des entreprises
- Gestion des abonnements (liaison avec subscription-service)

**Base de données** :
- Table `companies` : Informations entreprises
- Table `recruiters` : Comptes recruteurs
- Table `company_recruiters` : Association entreprises-recruteurs
- Table `invitations` : Invitations en attente

**Événements publiés** :
- `company.created`
- `company.updated`
- `recruiter.invited`
- `recruiter.joined`
- `recruiter.removed`

**Événements consommés** :
- `subscription.activated` (depuis subscription-service)
- `subscription.expired` (depuis subscription-service)

---

### 7. Search Service (`search-service`)
**Rôle** : Moteur de recherche de profils

**Responsabilités** :
- Indexation des profils validés dans ElasticSearch
- Recherche full-text avec filtres avancés
- Gestion des filtres (compétences, expérience, secteur, note admin)
- Calcul de la pertinence des résultats
- Gestion de l'anonymisation des profils selon règles métier
- Mise à jour de l'index lors des changements de profils

**Base de données** :
- Aucune base de données relationnelle
- ElasticSearch comme source de données principale

**Événements publiés** :
- `search.performed`
- `profile.viewed`

**Événements consommés** :
- `profile.validated` (depuis admin-service)
- `profile.updated` (depuis candidate-service)
- `profile.rejected` (depuis admin-service) → désindexation

---

### 8. Subscription Service (`subscription-service`)
**Rôle** : Gestion des abonnements et quotas

**Responsabilités** :
- Définition des plans d'abonnement (Freemium, Pro, Enterprise)
- Gestion des abonnements actifs
- Calcul et suivi des quotas (consultations CV, recherches, etc.)
- Vérification des limites d'utilisation
- Gestion des renouvellements
- Notification des expirations

**Base de données** :
- Table `plans` : Plans d'abonnement disponibles
- Table `subscriptions` : Abonnements actifs
- Table `quotas` : Suivi des quotas utilisés
- Table `quota_usage` : Historique d'utilisation

**Événements publiés** :
- `subscription.created`
- `subscription.activated`
- `subscription.expired`
- `subscription.renewed`
- `quota.exceeded`

**Événements consommés** :
- `payment.succeeded` (depuis payment-service)
- `profile.viewed` (depuis search-service) → décompte quota

---

### 9. Payment Service (`payment-service`)
**Rôle** : Gestion des paiements et facturation

**Responsabilités** :
- Intégration avec les passerelles de paiement (Stripe, PayPal)
- Traitement des paiements
- Génération de factures PDF
- Gestion des remboursements
- Historique des transactions
- Webhooks de paiement

**Base de données** :
- Table `payments` : Transactions de paiement
- Table `invoices` : Factures générées
- Table `payment_methods` : Méthodes de paiement enregistrées

**Événements publiés** :
- `payment.initiated`
- `payment.succeeded`
- `payment.failed`
- `invoice.generated`

**Événements consommés** :
- `subscription.created` (depuis subscription-service)

---

### 10. Notification Service (`notification-service`)
**Rôle** : Envoi de notifications (email, in-app)

**Responsabilités** :
- Envoi d'emails transactionnels (SMTP/SendGrid)
- Gestion des templates d'emails
- Notifications in-app
- Gestion des préférences de notification
- File d'attente des notifications
- Retry en cas d'échec

**Base de données** :
- Table `notifications` : Historique des notifications
- Table `notification_preferences` : Préférences utilisateurs

**Événements publiés** :
- `notification.sent`
- `notification.failed`

**Événements consommés** :
- `user.created` (depuis auth-service)
- `profile.validated` (depuis admin-service)
- `profile.rejected` (depuis admin-service)
- `interview.scheduled` (depuis admin-service)
- `payment.succeeded` (depuis payment-service)
- `subscription.expired` (depuis subscription-service)

---

### 11. Audit Service (`audit-service`)
**Rôle** : Traçabilité et journalisation

**Responsabilités** :
- Enregistrement de toutes les actions utilisateurs
- Logs d'accès aux profils
- Logs d'accès aux documents
- Traçabilité des modifications
- Conformité RGPD (droit à l'oubli)
- Génération de rapports d'audit

**Base de données** :
- Table `audit_logs` : Logs d'audit
- Table `access_logs` : Logs d'accès

**Événements publiés** :
- Aucun (service consommateur uniquement)

**Événements consommés** :
- Tous les événements métier pour traçabilité
- `profile.viewed`
- `document.accessed`
- `user.action` (toutes les actions utilisateurs)

---

## Conventions de nommage

### Structure des dossiers
- **Services** : `kebab-case` (ex: `auth-service`, `candidate-service`)
- **Modules Python** : `snake_case` (ex: `auth_service.py`, `user_service.py`)
- **Classes** : `PascalCase` (ex: `UserService`, `ProfileModel`)
- **Fonctions/Variables** : `snake_case` (ex: `get_user_by_id`, `user_email`)
- **Constantes** : `UPPER_SNAKE_CASE` (ex: `MAX_FILE_SIZE`, `DEFAULT_ROLE`)

### Base de données
- **Tables** : `snake_case`, pluriel (ex: `users`, `user_roles`, `job_preferences`)
- **Colonnes** : `snake_case` (ex: `created_at`, `user_id`, `is_active`)
- **Index** : `idx_<table>_<column>` (ex: `idx_users_email`)
- **Contraintes** : `fk_<table>_<column>`, `uk_<table>_<column>`

### API
- **Endpoints** : `kebab-case` (ex: `/api/v1/user-profiles`, `/api/v1/job-preferences`)
- **Versions** : `v1`, `v2`, etc.
- **Méthodes HTTP** : RESTful standard (GET, POST, PUT, PATCH, DELETE)

### Événements RabbitMQ
- **Format** : `<entity>.<action>` (ex: `profile.created`, `user.updated`)
- **Exchange** : `yemma.<service>` (ex: `yemma.candidate`, `yemma.admin`)
- **Queue** : `<service>.<event>` (ex: `notification.profile.validated`)

### Docker
- **Images** : `yemma-<service>` (ex: `yemma-auth-service`, `yemma-candidate-service`)
- **Conteneurs** : `yemma-<service>-<env>` (ex: `yemma-auth-service-dev`)
- **Réseaux** : `yemma-network`

### Variables d'environnement
- **Format** : `UPPER_SNAKE_CASE` avec préfixe service (ex: `AUTH_SERVICE_SECRET_KEY`, `DB_CANDIDATE_HOST`)
- **Préfixes** :
  - `AUTH_*` : Auth service
  - `CANDIDATE_*` : Candidate service
  - `DB_*` : Base de données
  - `RABBITMQ_*` : RabbitMQ
  - `S3_*` : Stockage S3

### Git
- **Branches** : `feature/<service>/<description>`, `fix/<service>/<description>`
- **Commits** : Conventionnelle (ex: `feat(auth): add OAuth2 support`)

---

## Communication inter-services

### Principes généraux

1. **Séparation synchrone/asynchrone** :
   - **Synchrone (HTTP/REST)** : Pour les opérations nécessitant une réponse immédiate
   - **Asynchrone (RabbitMQ)** : Pour les événements métier et les opérations non-bloquantes

2. **Service Discovery** : Utilisation de noms de services Docker pour la résolution DNS

3. **Circuit Breaker** : Implémentation de pattern Circuit Breaker pour les appels inter-services

4. **Retry Policy** : Stratégie de retry avec backoff exponentiel pour les appels HTTP

### Communication synchrone (HTTP/REST)

#### Pattern d'appel
```python
# Exemple : candidate-service appelle auth-service
GET http://auth-service:8001/api/v1/users/{user_id}
Headers: Authorization: Bearer <jwt_token>
```

#### Services exposant des APIs internes
- **Auth Service** : Validation de tokens, récupération d'infos utilisateur
- **Candidate Service** : Récupération de profils
- **Document Service** : Génération de liens temporaires
- **Company Service** : Vérification des permissions recruteur
- **Subscription Service** : Vérification des quotas

#### Authentification inter-services
- Utilisation de **Service-to-Service tokens** (JWT avec scope `internal`)
- Tokens générés par Auth Service avec secret partagé
- Validation automatique par middleware dans chaque service

### Communication asynchrone (RabbitMQ)

#### Architecture des échanges

**Exchanges** :
- `yemma.direct` : Échanges directs (routing key exact)
- `yemma.topic` : Échanges par pattern (routing key pattern)
- `yemma.fanout` : Broadcast (pas de routing key)

**Queues** :
- Nommage : `<service>.<event>` (ex: `notification.profile.validated`)
- Durabilité : Toutes les queues sont durables
- Dead Letter Queue : `dlq.<service>.<event>` pour les messages en échec

#### Événements principaux

| Événement | Publisher | Consumers | Description |
|-----------|-----------|-----------|-------------|
| `user.created` | auth-service | notification-service, audit-service | Nouvel utilisateur créé |
| `user.updated` | auth-service | audit-service | Utilisateur modifié |
| `profile.created` | candidate-service | audit-service | Profil candidat créé |
| `profile.submitted` | candidate-service | admin-service, notification-service | Profil soumis pour validation |
| `profile.validated` | admin-service | search-service, notification-service, candidate-service | Profil validé |
| `profile.rejected` | admin-service | search-service, notification-service, candidate-service | Profil refusé |
| `document.uploaded` | document-service | admin-service, audit-service | Document uploadé |
| `document.scanned` | document-service | admin-service | Scan antivirus terminé |
| `interview.scheduled` | admin-service | notification-service, audit-service | Entretien planifié |
| `payment.succeeded` | payment-service | subscription-service, notification-service | Paiement réussi |
| `subscription.activated` | subscription-service | company-service, audit-service | Abonnement activé |
| `subscription.expired` | subscription-service | company-service, notification-service | Abonnement expiré |
| `profile.viewed` | search-service | subscription-service, audit-service | Profil consulté |
| `quota.exceeded` | subscription-service | notification-service | Quota dépassé |

#### Pattern de consommation

**Consumer Pattern** :
```python
# Chaque service consomme les événements pertinents
# Utilisation de workers asynchrones (Celery ou aio-pika)
```

**Retry Strategy** :
- 3 tentatives avec backoff exponentiel
- Après échec : message vers Dead Letter Queue
- Monitoring des DLQ pour alertes

### Gestion des erreurs

#### Erreurs synchrones
- **4xx** : Erreur client → Retour immédiat avec message d'erreur
- **5xx** : Erreur serveur → Circuit Breaker activé, fallback si disponible

#### Erreurs asynchrones
- **NACK** : Message rejeté → Retry automatique
- **DLQ** : Après échecs répétés → Logging et alerte

### Service Discovery

#### Développement local (Docker Compose)
- Utilisation des noms de services Docker comme hostnames
- Exemple : `http://auth-service:8001`

#### Production (Kubernetes)
- Utilisation de Services Kubernetes
- DNS interne : `auth-service.yemma.svc.cluster.local`

### Monitoring et observabilité

#### Logging
- Format structuré JSON
- Champs standards : `timestamp`, `service`, `level`, `message`, `correlation_id`
- Centralisation via ELK Stack ou Loki

#### Métriques
- Prometheus pour la collecte
- Métriques par service : requêtes/seconde, latence, erreurs
- Grafana pour la visualisation

#### Tracing
- OpenTelemetry pour le tracing distribué
- Correlation ID propagé entre services

---

## Stack technologique

### Backend
- **Langage** : Python 3.10+
- **Framework** : FastAPI 0.104+
- **ORM** : SQLModel (combine Pydantic + SQLAlchemy)
- **Migrations** : Alembic
- **Validation** : Pydantic v2

### Bases de données
- **PostgreSQL 15+** : Données relationnelles (tous les services sauf search)
- **ElasticSearch 8+** : Moteur de recherche (search-service)
- **Redis** : Cache et sessions (optionnel)

### Messaging
- **RabbitMQ 3.12+** : Message broker asynchrone
- **aio-pika** : Client Python asynchrone pour RabbitMQ

### Stockage
- **MinIO** (dev) / **AWS S3** (prod) : Stockage de fichiers
- **boto3** : Client Python pour S3

### Sécurité
- **JWT** : python-jose[cryptography]
- **OAuth2** : FastAPI OAuth2PasswordBearer
- **Hashing** : passlib[bcrypt]
- **Encryption** : cryptography

### Conteneurisation
- **Docker** : Conteneurisation des services
- **Docker Compose** : Orchestration locale
- **Kubernetes** : Orchestration production (optionnel)

### API Gateway
- **Nginx** : Reverse proxy et load balancing
- **Kong** : Alternative pour API Gateway avancé (optionnel)

### Monitoring
- **Prometheus** : Métriques
- **Grafana** : Visualisation
- **ELK Stack / Loki** : Logging centralisé

### Tests
- **pytest** : Framework de tests
- **pytest-asyncio** : Tests asynchrones
- **httpx** : Client HTTP pour tests

### CI/CD
- **GitHub Actions** : Intégration continue
- **Docker Hub / ECR** : Registry d'images

---

## Diagramme de flux de données

### Flux de validation d'un profil

```
1. Candidat soumet profil
   candidate-service → RabbitMQ: profile.submitted
   
2. Admin Service reçoit l'événement
   RabbitMQ → admin-service: profile.submitted
   
3. Admin vérifie les documents
   admin-service → document-service (HTTP): GET /documents/{profile_id}
   
4. Admin valide le profil
   admin-service → RabbitMQ: profile.validated
   
5. Search Service indexe le profil
   RabbitMQ → search-service: profile.validated
   
6. Notification envoyée au candidat
   RabbitMQ → notification-service: profile.validated
   
7. Audit log créé
   RabbitMQ → audit-service: profile.validated
```

### Flux de consultation d'un profil

```
1. Recruteur recherche un profil
   Frontend → api-gateway → search-service: GET /search
   
2. Vérification du quota
   search-service → subscription-service (HTTP): GET /quotas/{company_id}
   
3. Affichage du profil
   search-service → candidate-service (HTTP): GET /profiles/{id}
   
4. Log d'accès créé
   search-service → RabbitMQ: profile.viewed
   
5. Décompte du quota
   RabbitMQ → subscription-service: profile.viewed
   
6. Audit log créé
   RabbitMQ → audit-service: profile.viewed
```

---

## Prochaines étapes

1. **Initialisation du monorepo** : Création de la structure de dossiers
2. **Configuration Docker** : docker-compose.yml avec tous les services
3. **Configuration partagée** : Module `shared` avec utilitaires communs
4. **Implémentation des services** : Développement progressif service par service
5. **Tests d'intégration** : Tests end-to-end entre services
6. **Documentation API** : OpenAPI/Swagger pour chaque service

---

*Document créé le : 2024*
*Version : 1.0*

