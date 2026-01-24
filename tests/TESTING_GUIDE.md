# Guide de Tests - Yemma Solutions

## Vue d'ensemble

Cette suite de tests couvre tous les services de la plateforme Yemma Solutions, à l'exception des services d'abonnement et de paiement qui seront développés ultérieurement.

## Structure des Tests

### Backend (Python/FastAPI)

```
tests/backend/
├── conftest.py              # Configuration pytest et fixtures
├── test_mocks.py            # Mocks et fixtures de données
├── test_auth_service.py     # Tests du service d'authentification
├── test_candidate_service.py # Tests du service candidat
├── test_company_service.py  # Tests du service entreprise
├── test_document_service.py # Tests du service document
├── test_search_service.py   # Tests du service de recherche
├── test_notification_service.py # Tests du service notification
├── test_repositories.py     # Tests des repositories
├── test_completion.py       # Tests de validation de profil
└── test_validators.py       # Tests des validateurs
```

### Frontend (React)

```
tests/frontend/
├── vitest.config.js         # Configuration Vitest
├── setupTests.js            # Configuration des tests React
├── components/              # Tests des composants
│   ├── AuthGuard.test.jsx
│   └── onboarding/
│       ├── Step2.test.jsx
│       └── Step5.test.jsx
├── pages/                   # Tests des pages
│   └── Login.test.jsx
├── services/                # Tests des services API
│   └── api.test.js
└── utils/                   # Tests des utilitaires
    └── onboardingApiMapper.test.js
```

### Tests Fonctionnels

```
tests/functional/
└── test_onboarding_flow.py  # Tests end-to-end du flux d'onboarding
```

## Installation

### Prérequis Backend

```bash
pip install -r tests/requirements.txt
```

### Prérequis Frontend

```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
```

## Exécution des Tests

### Tous les tests

```bash
# Backend
pytest tests/backend/ -v

# Frontend
cd frontend && npm run test

# Tous
make -f Makefile.test test-all
```

### Tests par catégorie

```bash
# Tests unitaires uniquement
pytest -m unit

# Tests d'intégration
pytest -m integration

# Tests fonctionnels
pytest -m functional
```

### Avec couverture

```bash
# Backend
pytest --cov=services --cov-report=html

# Frontend
cd frontend && npm run test:coverage
```

## Services Testés

### ✅ Services Inclus

1. **Auth Service** : Inscription, connexion, gestion des utilisateurs
2. **Candidate Service** : Profils candidats, onboarding, compétences
3. **Company Service** : Entreprises, invitations, équipes
4. **Document Service** : Upload, validation, stockage
5. **Search Service** : Recherche, indexation Elasticsearch
6. **Notification Service** : Emails, notifications

### ❌ Services Exclus (développement ultérieur)

- Payment Service (abonnements)
- Stripe Integration (paiements)

## Types de Tests

### Tests Unitaires

- **Backend** : Fonctions individuelles, repositories, validateurs
- **Frontend** : Composants isolés, utilitaires, services

### Tests d'Intégration

- Communication entre services
- Validation des endpoints API
- Gestion des erreurs

### Tests Fonctionnels

- Flux d'onboarding complet
- Parcours utilisateur end-to-end
- Scénarios métier complets

## Exemples de Tests

### Test Backend - Création de profil

```python
@pytest.mark.unit
@pytest.mark.asyncio
async def test_create_profile_success(client: AsyncClient, auth_token: str):
    response = await client.post(
        "/api/v1/profiles",
        json={"first_name": "John", "last_name": "Doe", ...},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201
    assert "id" in response.json()
```

### Test Frontend - Composant AuthGuard

```javascript
it('devrait rediriger vers /login si aucun token n\'est présent', async () => {
  render(<AuthGuard requireAuth={true}>...</AuthGuard>)
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/login', ...)
  })
})
```

## Configuration

### Variables d'environnement de test

Créer `.env.test` :

```env
DATABASE_URL=postgresql+asyncpg://test_user:test_password@localhost:5432/test_yemma_db
AUTH_SERVICE_URL=http://localhost:8001
CANDIDATE_SERVICE_URL=http://localhost:8002
# ... autres services
```

## Bonnes Pratiques

1. **Isolation** : Chaque test est indépendant
2. **Fixtures** : Réutilisation de données de test
3. **Mocks** : Simulation des dépendances externes
4. **Nettoyage** : Base de données réinitialisée après chaque test
5. **Nommage** : Noms de tests descriptifs et en français

## Couverture Cible

- **Backend** : > 80% de couverture
- **Frontend** : > 70% de couverture
- **Services critiques** : > 90% de couverture

## Maintenance

- Exécuter les tests avant chaque commit
- Ajouter des tests pour chaque nouvelle fonctionnalité
- Maintenir la couverture de code au-dessus des seuils
- Mettre à jour les mocks lors des changements d'API
