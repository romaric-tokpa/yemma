# Solution au Problème SQLAlchemy "Table Already Defined"

## Problème

Les tests de repositories échouent avec :
```
sqlalchemy.exc.InvalidRequestError: Table 'profiles' is already defined for this MetaData instance.
```

## Cause

SQLModel utilise une instance de métadonnées globale (`SQLModel.metadata`) qui est partagée entre tous les imports. Quand les modèles sont importés plusieurs fois (dans `conftest.py` pour les fixtures mock, puis dans `test_repositories.py`), SQLAlchemy détecte que la table est déjà définie.

## Solutions

### Solution 1 : Utiliser extend_existing=True dans les modèles (Recommandé pour la production)

Modifier `services/candidate/app/domain/models.py` pour ajouter `extend_existing=True` :

```python
class Profile(SQLModel, table=True):
    __tablename__ = "profiles"
    __table_args__ = {'extend_existing': True}  # Ajouter cette ligne
    # ... reste du modèle
```

**Avantages** : Résout le problème à la source
**Inconvénients** : Nécessite de modifier les modèles de production

### Solution 2 : Utiliser SQLite en mémoire avec extend_existing=True (Implémenté)

La fixture `test_db_session_sqlite` utilise SQLite en mémoire et `extend_existing=True` lors de la création des tables.

**Avantages** : 
- Pas besoin de PostgreSQL
- Tests plus rapides
- Isolation complète

**Inconvénients** : 
- Nécessite `aiosqlite`
- Peut avoir des différences avec PostgreSQL

### Solution 3 : Exécuter les tests dans des processus séparés

Utiliser `pytest-forked` pour isoler les tests :

```bash
pip install pytest-forked
pytest tests/backend/test_repositories.py -v --forked
```

**Avantages** : Isolation complète
**Inconvénients** : Plus lent, nécessite une dépendance supplémentaire

### Solution 4 : Créer une nouvelle instance de métadonnées (Complexe)

Créer une nouvelle instance de métadonnées pour chaque test, mais cela nécessite de modifier la façon dont SQLModel fonctionne.

## Solution Recommandée

Pour les tests, utiliser **Solution 2** (SQLite en mémoire avec `extend_existing=True`).

Pour la production, considérer **Solution 1** si le problème persiste dans d'autres contextes.

## Installation

```bash
pip install aiosqlite==0.19.0
```

## Exécution

```bash
pytest tests/backend/test_repositories.py -v
```

## Note

Si les tests sont toujours bloqués ou échouent, vérifier que :
1. `aiosqlite` est installé
2. Les modèles sont importés correctement
3. La fixture `shared_sqlite_engine` est bien créée au niveau session
