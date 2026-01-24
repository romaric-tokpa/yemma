# Note sur les Tests de Repositories

## Problème SQLAlchemy

Les tests de repositories (`test_repositories.py`) peuvent échouer avec l'erreur :
```
sqlalchemy.exc.InvalidRequestError: Table 'profiles' is already defined for this MetaData instance.
```

## Cause

SQLModel utilise une instance de métadonnées globale partagée. Quand les modèles sont importés plusieurs fois dans le même processus Python (par exemple, dans `conftest.py` pour les fixtures mock, puis dans `test_repositories.py`), SQLAlchemy détecte que la table est déjà définie.

## Solutions

### Option 1 : Exécuter les tests isolément (recommandé)

```bash
pytest tests/backend/test_repositories.py -v
```

### Option 2 : Utiliser un processus séparé

```bash
pytest tests/backend/test_repositories.py -v --forked
```

(Requiert `pytest-forked`)

### Option 3 : Modifier les modèles pour utiliser `extend_existing=True`

Cela nécessiterait de modifier `services/candidate/app/domain/models.py` pour ajouter `extend_existing=True` à chaque table, ce qui n'est pas recommandé.

## Tests marqués comme isolés

Les tests suivants sont marqués avec `@pytest.mark.isolated` :
- `test_profile_repository_create`
- `test_skill_repository_create_technical`
- `test_skill_repository_create_soft`

Ces tests doivent être exécutés séparément ou dans un processus isolé.

## Base de données de test

Les tests de repositories nécessitent une base de données PostgreSQL de test. Assurez-vous que :
1. PostgreSQL est en cours d'exécution
2. Le rôle `test_user` existe
3. La base de données `test_yemma_db` existe

Ou modifiez `TEST_DATABASE_URL` dans `conftest.py` pour utiliser SQLite en mémoire :
```python
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
```
