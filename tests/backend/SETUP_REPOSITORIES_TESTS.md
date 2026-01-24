# Configuration des tests de repositories

## Base de données

Les tests de repositories utilisent **PostgreSQL** via la fixture `test_db_session` du `conftest.py` :
`postgresql+asyncpg://test_user:test_password@localhost:5432/test_yemma_db`.

## Prérequis

1. **PostgreSQL** installé et démarré.
2. Créer le rôle et la base de test :

```sql
CREATE USER test_user WITH PASSWORD 'test_password';
CREATE DATABASE test_yemma_db OWNER test_user;
```

Sous macOS avec Postgres.app :

```bash
psql -d postgres -c "CREATE USER test_user WITH PASSWORD 'test_password';"
psql -d postgres -c "CREATE DATABASE test_yemma_db OWNER test_user;"
```

## Conflit SQLAlchemy « Table already defined »

Pour éviter `InvalidRequestError: Table 'profiles' is already defined`, tous les modèles du service candidate ont `__table_args__ = {'extend_existing': True}` dans `services/candidate/app/domain/models.py`.

## Exécution

```bash
pytest tests/backend/test_repositories.py -v
```

Si la base de test n’est pas configurée, vous obtiendrez :
`asyncpg.exceptions.InvalidAuthorizationSpecificationError: role "test_user" does not exist`.

## À propos de SQLite

SQLite en mémoire n’est **pas** utilisée pour ces tests : les modèles utilisent le type **ARRAY** (PostgreSQL) dans `JobPreference.desired_positions`, que SQLite ne supporte pas.
