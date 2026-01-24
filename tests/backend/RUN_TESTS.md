# Guide d'exécution des tests backend

## Problème de conflits d'imports

Certains tests doivent être exécutés séparément pour éviter les conflits d'imports entre services :

- `test_validators.py` : Doit être exécuté séparément car il nécessite que seul le service `document` soit dans le PYTHONPATH
- `test_completion.py` : Doit être exécuté séparément car il nécessite que seul le service `candidate` soit dans le PYTHONPATH

## Exécution recommandée

### Tous les tests (sauf ceux avec conflits)
```bash
pytest tests/backend/ --ignore=tests/backend/test_validators.py --ignore=tests/backend/test_completion.py -v
```

### Tests de validateurs (séparément)
```bash
pytest tests/backend/test_validators.py -v
```

### Tests de completion (séparément)
```bash
pytest tests/backend/test_completion.py -v
```

### Tous les tests unitaires (sans les tests d'intégration qui nécessitent les services)
```bash
pytest tests/backend/ -v -m unit --ignore=tests/backend/test_validators.py --ignore=tests/backend/test_completion.py
pytest tests/backend/test_validators.py -v -m unit
pytest tests/backend/test_completion.py -v -m unit
```

## Note

Les tests d'intégration nécessitent que tous les services soient en cours d'exécution (via Docker ou localement).
