# Tests Unitaires et Fonctionnels - Yemma Solutions

Ce répertoire contient tous les tests unitaires et fonctionnels pour la plateforme Yemma Solutions.

## Structure

```
tests/
├── backend/              # Tests backend (Python/FastAPI)
│   ├── conftest.py      # Configuration pytest pour backend
│   ├── test_auth_service.py
│   ├── test_candidate_service.py
│   ├── test_company_service.py
│   ├── test_document_service.py
│   ├── test_search_service.py
│   └── test_notification_service.py
├── frontend/             # Tests frontend (React)
│   ├── components/       # Tests des composants
│   ├── services/         # Tests des services API
│   ├── utils/           # Tests des utilitaires
│   ├── vitest.config.js # Configuration Vitest
│   └── setupTests.js     # Configuration des tests React
├── functional/          # Tests fonctionnels end-to-end
│   └── test_onboarding_flow.py
├── requirements.txt     # Dépendances Python pour tests
└── README.md           # Ce fichier
```

## Installation

### Backend

```bash
# Installer les dépendances de test
pip install -r tests/requirements.txt
```

### Frontend

```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

## Exécution des tests

### Tests Backend

```bash
# Tous les tests
pytest

# Tests unitaires uniquement
pytest -m unit

# Tests d'intégration
pytest -m integration

# Tests fonctionnels
pytest -m functional

# Avec couverture de code
pytest --cov=services --cov-report=html
```

### Tests Frontend

```bash
cd frontend
npm run test

# En mode watch
npm run test:watch

# Avec couverture
npm run test:coverage
```

## Services testés

### Backend
- ✅ **Auth Service** : Authentification, inscription, connexion
- ✅ **Candidate Service** : Gestion des profils candidats, onboarding
- ✅ **Company Service** : Gestion des entreprises, invitations
- ✅ **Document Service** : Upload, validation, stockage de documents
- ✅ **Search Service** : Recherche de candidats, indexation
- ✅ **Notification Service** : Envoi d'emails, notifications

### Frontend
- ✅ **Composants** : AuthGuard, OnboardingStepper, Step5, etc.
- ✅ **Services API** : Gestion des appels API, interceptors
- ✅ **Utilitaires** : Mappers, helpers

### Tests Fonctionnels
- ✅ **Flux d'onboarding candidat** : Parcours complet
- ✅ **Flux d'onboarding entreprise** : Création et configuration

## Exclusions

Les services suivants sont **exclus** des tests (développement ultérieur) :
- ❌ Service d'abonnement (Payment Service)
- ❌ Service de paiement (Stripe integration)

## Configuration

### Variables d'environnement de test

Créer un fichier `.env.test` avec :

```env
# Base de données de test
DATABASE_URL=postgresql+asyncpg://test_user:test_password@localhost:5432/test_yemma_db

# Services
AUTH_SERVICE_URL=http://localhost:8001
CANDIDATE_SERVICE_URL=http://localhost:8002
COMPANY_SERVICE_URL=http://localhost:8003
DOCUMENT_SERVICE_URL=http://localhost:8004
SEARCH_SERVICE_URL=http://localhost:8005
NOTIFICATION_SERVICE_URL=http://localhost:8006

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Notes importantes

1. Les tests utilisent une base de données de test séparée
2. Les tests sont isolés et peuvent être exécutés en parallèle
3. Les mocks sont utilisés pour les appels inter-services
4. Les tests fonctionnels nécessitent tous les services en cours d'exécution
