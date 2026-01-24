# Tests - Yemma Solutions

Suite complète de tests unitaires et fonctionnels pour la plateforme Yemma Solutions.

## 🎯 Vue d'ensemble

Ce répertoire contient tous les tests pour garantir la qualité et la fiabilité de la plateforme :
- Tests unitaires backend (Python/FastAPI)
- Tests unitaires frontend (React/Vitest)
- Tests d'intégration
- Tests fonctionnels end-to-end

## 📁 Structure

```
tests/
├── backend/              # Tests backend (Python/FastAPI)
│   ├── conftest.py      # Configuration pytest pour backend
│   ├── test_auth_service.py
│   ├── test_candidate_service.py
│   ├── test_company_service.py
│   ├── test_document_service.py
│   ├── test_notification_service.py
│   ├── test_repositories.py
│   ├── test_validators.py
│   ├── test_completion.py
│   └── test_mocks.py
├── frontend/             # Tests frontend (React)
│   ├── components/      # Tests des composants
│   │   ├── AuthGuard.test.jsx
│   │   └── onboarding/
│   │       ├── Step2.test.jsx
│   │       └── Step5.test.jsx
│   ├── pages/           # Tests des pages
│   │   └── Login.test.jsx
│   ├── services/        # Tests des services API
│   │   └── api.test.js
│   ├── utils/           # Tests des utilitaires
│   │   └── onboardingApiMapper.test.js
│   ├── vitest.config.js # Configuration Vitest
│   └── setupTests.js     # Configuration des tests React
├── functional/          # Tests fonctionnels end-to-end
│   └── test_onboarding_flow.py
├── requirements.txt     # Dépendances Python pour tests
└── README.md           # Ce fichier
```

## 🚀 Installation

### Backend

```bash
# Installer les dépendances de test
pip install -r tests/requirements.txt

# Ou depuis la racine du projet
pip install -r tests/requirements.txt
```

### Frontend

```bash
cd frontend

# Les dépendances de test sont déjà dans package.json
npm install
```

## 🧪 Exécution des tests

### Tests Backend

```bash
# Depuis la racine du projet
cd tests/backend

# Tous les tests
pytest

# Tests unitaires uniquement
pytest -m unit

# Tests d'intégration
pytest -m integration

# Tests fonctionnels
pytest -m functional

# Un fichier spécifique
pytest test_candidate_service.py

# Un test spécifique
pytest test_candidate_service.py::test_create_profile

# Avec couverture de code
pytest --cov=services --cov-report=html

# Mode verbose
pytest -v

# Avec output détaillé
pytest -vv -s
```

### Tests Frontend

```bash
cd frontend

# Tous les tests
npm test

# En mode watch (développement)
npm run test:watch

# Avec couverture
npm run test:coverage

# Un fichier spécifique
npm test -- AuthGuard.test.jsx

# Mode UI (Vitest UI)
npm run test:ui
```

### Tests Fonctionnels

```bash
# Assurez-vous que tous les services sont démarrés
docker-compose up -d

# Exécuter les tests fonctionnels
cd tests/functional
pytest test_onboarding_flow.py
```

## 📊 Services testés

### Backend

| Service | Tests | Statut |
|---------|-------|--------|
| **Auth Service** | Authentification, inscription, connexion, rôles | ✅ |
| **Candidate Service** | Gestion des profils, onboarding, complétion | ✅ |
| **Company Service** | Entreprises, recruteurs, invitations | ✅ |
| **Document Service** | Upload, validation, stockage | ✅ |
| **Search Service** | Recherche, indexation | ✅ |
| **Notification Service** | Envoi d'emails, notifications | ✅ |
| **Admin Service** | Validation, rejet, archivage | ✅ |

### Frontend

| Composant | Tests | Statut |
|-----------|-------|--------|
| **AuthGuard** | Protection des routes | ✅ |
| **OnboardingStepper** | Navigation entre étapes | ✅ |
| **Step2** | Gestion des expériences | ✅ |
| **Step5** | Gestion des compétences | ✅ |
| **Login** | Formulaire de connexion | ✅ |
| **API Client** | Appels API, interceptors | ✅ |
| **Utils** | Mappers, helpers | ✅ |

### Tests Fonctionnels

| Flux | Tests | Statut |
|------|-------|--------|
| **Onboarding candidat** | Parcours complet | ✅ |
| **Onboarding entreprise** | Création et configuration | ✅ |

## ⚙️ Configuration

### Variables d'environnement de test

Créer un fichier `.env.test` à la racine avec :

```env
# Base de données de test
DATABASE_URL=postgresql+asyncpg://test_user:test_password@localhost:5432/test_yemma_db

# Services (utiliser des mocks ou services de test)
AUTH_SERVICE_URL=http://localhost:8001
CANDIDATE_SERVICE_URL=http://localhost:8002
COMPANY_SERVICE_URL=http://localhost:8005
DOCUMENT_SERVICE_URL=http://localhost:8003
SEARCH_SERVICE_URL=http://localhost:8004
NOTIFICATION_SERVICE_URL=http://localhost:8007
ADMIN_SERVICE_URL=http://localhost:8009

# Frontend
FRONTEND_URL=http://localhost:3000

# Test mode
TESTING=true
```

### Configuration Pytest

Le fichier `pytest.ini` à la racine configure pytest :

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
markers =
    unit: Tests unitaires
    integration: Tests d'intégration
    functional: Tests fonctionnels
```

### Configuration Vitest

Le fichier `frontend/vitest.config.js` configure Vitest :

```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/frontend/setupTests.js',
  }
})
```

## 🎯 Stratégie de test

### Tests unitaires

Testent des fonctions et méthodes isolées :
- Logique métier
- Validateurs
- Utilitaires
- Repositories (avec mocks)

### Tests d'intégration

Testent l'interaction entre composants :
- Endpoints API
- Intégration base de données
- Communication inter-services

### Tests fonctionnels

Testent des flux complets :
- Onboarding candidat
- Onboarding entreprise
- Validation de profil
- Recherche de candidats

## 📝 Exemples de tests

### Test backend (Python)

```python
import pytest
from services.candidate.app.domain.models import Profile

def test_create_profile():
    profile = Profile(
        user_id=1,
        status="DRAFT",
        completion_percentage=0
    )
    assert profile.user_id == 1
    assert profile.status == "DRAFT"
```

### Test frontend (React)

```javascript
import { render, screen } from '@testing-library/react'
import { AuthGuard } from '@/components/AuthGuard'

test('renders children when authenticated', () => {
  render(<AuthGuard>Content</AuthGuard>)
  expect(screen.getByText('Content')).toBeInTheDocument()
})
```

## 🔄 CI/CD

### GitHub Actions (exemple)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
      - run: pip install -r tests/requirements.txt
      - run: pytest

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd frontend && npm install && npm test
```

## 📊 Couverture de code

### Backend

```bash
# Générer le rapport de couverture
pytest --cov=services --cov-report=html

# Voir le rapport
open htmlcov/index.html
```

### Frontend

```bash
cd frontend
npm run test:coverage

# Voir le rapport
open coverage/index.html
```

**Objectif** : Maintenir une couverture > 80%

## 🚫 Exclusions

Les services suivants sont **exclus** des tests (développement ultérieur) :
- ❌ Service de paiement (Payment Service) - Tests Stripe complexes
- ❌ Service d'audit (Audit Service) - Tests de conformité RGPD

## 📚 Documentation supplémentaire

- [Guide de test](./TESTING_GUIDE.md)
- [Résumé des erreurs](./backend/RESUME_ERREURS.md)
- [Solution imports](./backend/SOLUTION_IMPORTS.md)
- [Solution SQLAlchemy](./backend/SOLUTION_SQLALCHEMY.md)
- [Setup repositories](./backend/SETUP_REPOSITORIES_TESTS.md)

## 🐛 Dépannage

### Erreurs de connexion à la base de données

Assurez-vous que PostgreSQL est démarré :
```bash
docker-compose up -d postgres-auth
```

### Erreurs d'import

Vérifiez que les chemins Python sont corrects dans `conftest.py`.

### Tests qui échouent de manière intermittente

- Vérifiez les timeouts
- Utilisez des fixtures pour isoler les tests
- Vérifiez les mocks

## 🚀 Prochaines étapes

- [ ] Ajouter les tests E2E avec Playwright
- [ ] Implémenter les tests de performance
- [ ] Ajouter les tests de sécurité
- [ ] Implémenter les tests de charge
- [ ] Ajouter les tests de compatibilité navigateurs

---

**Tests développés pour Yemma Solutions**
