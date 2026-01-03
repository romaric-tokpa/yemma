# Guide de Migration - Service Candidate

## Création de la migration initiale

### Option 1: Avec Docker Compose

```bash
# Démarrer les services
docker-compose up -d postgres

# Attendre que PostgreSQL soit prêt
sleep 5

# Créer la migration
docker-compose exec candidate-service alembic revision --autogenerate -m "Initial migration"

# Appliquer la migration
docker-compose exec candidate-service alembic upgrade head
```

### Option 2: En local (avec environnement virtuel)

```bash
cd services/candidate

# Créer un environnement virtuel (si pas déjà fait)
python3 -m venv .venv
source .venv/bin/activate  # Sur Windows: .venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env  # Modifier selon votre configuration

# Créer la migration
alembic revision --autogenerate -m "Initial migration"

# Appliquer la migration
alembic upgrade head
```

## Vérification

Après avoir appliqué les migrations, vous pouvez vérifier que les tables ont été créées :

```bash
# Avec Docker
docker-compose exec postgres psql -U postgres -d yemma_db -c "\dt"

# Ou en local (si psql est installé)
psql -U postgres -d yemma_db -c "\dt"
```

Vous devriez voir les tables suivantes :
- profiles
- experiences
- educations
- certifications
- skills
- job_preferences
- alembic_version

## Tests des endpoints

Une fois le service démarré, vous pouvez tester les endpoints via :

1. **Documentation interactive** : http://localhost:8002/docs
2. **ReDoc** : http://localhost:8002/redoc
3. **Health check** : http://localhost:8002/health

## Notes importantes

- Assurez-vous que la base de données PostgreSQL est accessible
- Vérifiez que les variables d'environnement sont correctement configurées
- Le service utilise la même base de données que les autres services (`yemma_db`)
- Les migrations Alembic utilisent une connexion synchrone (sans asyncpg)

