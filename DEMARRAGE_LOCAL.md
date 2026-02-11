# Démarrage en local (développement)

## Erreurs fréquentes

| Erreur | Cause | Solution |
|--------|--------|----------|
| `POST http://localhost:8001/... net::ERR_CONNECTION_REFUSED` | Service **Auth** non démarré | Démarrer Auth (voir ci‑dessous). |
| `POST http://localhost:8002/... net::ERR_CONNECTION_REFUSED` | Service **Candidate** non démarré | Démarrer le service Candidate (voir ci‑dessous). |

Le frontend appelle :
- **8001** = Auth (inscription / connexion)
- **8002** = Candidate (profil, onboarding CV, etc.)
- **8003** = Document (upload de fichiers)

### Solution : démarrer les services backend

À la **racine du projet** (où se trouve `docker-compose.dev.yml`) :

```bash
# 1. Copier l'environnement si besoin
cp env.example .env

# 2. Démarrer l'infra + Auth (pour l'inscription / connexion)
docker-compose -f docker-compose.dev.yml up -d postgres redis notification auth

# 3. Démarrer Candidate (pour l'onboarding CV et le profil)
docker-compose -f docker-compose.dev.yml up -d candidate

# 4. (Optionnel) Démarrer Document pour l'upload du CV après parsing
docker-compose -f docker-compose.dev.yml up -d document
```

Ou en une seule commande (Auth + Candidate + Document + dépendances) :

```bash
docker-compose -f docker-compose.dev.yml up -d postgres redis notification auth candidate document
```

Attendre ~30 secondes que les conteneurs soient prêts, puis réessayer sur le frontend.

Pour **tout** démarrer :

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Vérifier que les services répondent

```bash
# Auth (port 8001)
curl -s http://localhost:8001/health
# doit retourner du JSON (ex: {"status":"healthy",...})

# Candidate (port 8002)
curl -s http://localhost:8002/health
# doit retourner du JSON (ex: {"status":"healthy","service":"candidate-service",...})
```

### Diagnostic : service Candidate qui crash (`ERR_CONNECTION_RESET`)

Si vous obtenez `ERR_CONNECTION_RESET` sur le port 8002, le service Candidate démarre puis crash.

**1. Vérifier les logs :**
```bash
docker-compose -f docker-compose.dev.yml logs candidate --tail=100
```

**2. Causes fréquentes :**
- **Erreur d'import Python** : vérifier que les nouveaux fichiers (`hrflow_client.py`, `hrflow_mapper.py`) sont bien présents dans `services/candidate/app/`
- **Problème de base de données** : vérifier que PostgreSQL est démarré et accessible
- **Variables d'environnement manquantes** : vérifier que `.env` contient les variables nécessaires

**3. Reconstruire l'image si nécessaire :**
```bash
# Arrêter le service
docker-compose -f docker-compose.dev.yml stop candidate

# Reconstruire l'image (si le Dockerfile a changé)
docker-compose -f docker-compose.dev.yml build candidate

# Redémarrer
docker-compose -f docker-compose.dev.yml up -d candidate

# Suivre les logs en temps réel
docker-compose -f docker-compose.dev.yml logs -f candidate
```

**4. Vérifier que les fichiers sont bien dans le conteneur :**
```bash
docker-compose -f docker-compose.dev.yml exec candidate ls -la /app/app/infrastructure/hrflow_client.py
docker-compose -f docker-compose.dev.yml exec candidate ls -la /app/app/utils/hrflow_mapper.py
```

### Option sans Docker : lancer Auth avec uvicorn

Si vous préférez lancer le service Auth sans Docker (avec une base PostgreSQL et Redis déjà en cours d'exécution) :

```bash
cd services/auth-service
pip install -r requirements.txt
# Configurer DATABASE_URL, REDIS_URL, JWT_SECRET_KEY dans .env ou export
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Le frontend doit alors être servi depuis `http://localhost:3000` (Vite) pour que l’URL par défaut `http://localhost:8001` soit utilisée pour l’API Auth.
