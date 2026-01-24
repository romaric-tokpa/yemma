# Solution aux Conflits d'Imports dans les Tests

## Problème

Les modules utilisent des imports relatifs (`from app.core.exceptions`) qui nécessitent que le répertoire du service soit dans le PYTHONPATH. Quand pytest charge tous les tests, `conftest.py` est exécuté en premier et peut ajouter plusieurs services au PYTHONPATH, créant des conflits.

## Solution

### Tests qui fonctionnent individuellement

Les tests suivants passent quand exécutés individuellement :
- ✅ `test_completion.py` : 6 tests passent
- ✅ `test_validators.py` : 4 tests passent
- ✅ `test_repositories.py` : Tests unitaires des repositories
- ✅ Autres tests de services : Tests d'API (nécessitent les services en cours d'exécution)

### Tests avec conflits lors de la collecte

- ⚠️ `test_validators.py` : Conflit si `test_completion.py` est chargé avant (service candidate vs document)
- ⚠️ `test_completion.py` : Conflit si `test_validators.py` est chargé avant

## Recommandation d'exécution

### Option 1 : Exécution séparée (recommandée)

```bash
# Tests de completion
pytest tests/backend/test_completion.py -v

# Tests de validateurs
pytest tests/backend/test_validators.py -v

# Autres tests (sans ceux avec conflits)
pytest tests/backend/ --ignore=tests/backend/test_validators.py --ignore=tests/backend/test_completion.py -v
```

### Option 2 : Utiliser pytest-xdist pour isoler les tests

```bash
pip install pytest-xdist
pytest tests/backend/ -n auto --dist=worksteal
```

### Option 3 : Utiliser des markers pour exclure les tests problématiques

```bash
pytest tests/backend/ -v -m "not isolated"
```

## Corrections effectuées

1. ✅ Ajout du PYTHONPATH dans chaque fichier de test
2. ✅ Vidage du cache des modules avant les imports
3. ✅ Retrait des autres services du PYTHONPATH
4. ✅ Correction des fixtures (retrait des `spec=` pour éviter les conflits SQLAlchemy)
5. ✅ Ajout des champs manquants dans les mocks (`description`, `target_sectors`)

## État actuel

- **Tests unitaires** : ✅ Tous passent individuellement
- **Tests d'intégration** : ⚠️ Nécessitent les services en cours d'exécution (erreurs `httpx.ConnectError` sont normales)
- **Collecte de tous les tests** : ⚠️ Conflit entre `test_completion.py` et `test_validators.py`

## Solution finale recommandée

Exécuter les tests avec conflits séparément :

```bash
# Script pour exécuter tous les tests
pytest tests/backend/test_completion.py -v
pytest tests/backend/test_validators.py -v
pytest tests/backend/ --ignore=tests/backend/test_validators.py --ignore=tests/backend/test_completion.py -v
```
