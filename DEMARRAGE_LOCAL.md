# Démarrage en local (développement)

## Erreurs fréquentes

| Erreur | Cause | Solution |
|--------|--------|----------|
| `POST http://localhost:8001/... net::ERR_CONNECTION_REFUSED` | Service **Auth** non démarré | Démarrer Auth (voir ci‑dessous). |
| `POST http://localhost:8002/... net::ERR_CONNECTION_REFUSED` | Service **Candidate** non démarré | Démarrer le service Candidate (voir ci‑dessous). |

En dev, le frontend (port 3000) utilise un proxy Vite vers la gateway nginx (port 8080).
Sans nginx : définir `VITE_PROXY_TARGET=http://localhost:8001` dans `.env` pour pointer directement vers Auth.

Services exposés :
- **8080** = Nginx (gateway) → Auth, Candidate, etc.
- **8001** = Auth (accès direct si sans nginx)
- **8002** = Candidate
- **8003** = Document

### Compte Super Admin

Un compte super administrateur est créé automatiquement au démarrage du service Auth :

- **Email :** `admin@yemma.com` (ou `SUPER_ADMIN_EMAIL` dans `.env`)
- **Mot de passe :** `12345678` (ou `SUPER_ADMIN_PASSWORD` dans `.env`)

Connexion : `/login` → redirection vers `/admin/dashboard`.

Pour créer manuellement : `./scripts/create-super-admin.sh`

### Solution : démarrer les services backend

À la **racine du projet** (où se trouve `docker-compose.dev.yml`) :

```bash
# 1. Copier l'environnement si besoin
cp env.example .env

# 2. Démarrer l'infra + Auth (pour l'inscription / connexion)
docker-compose -f docker-compose.dev.yml up -d postgres redis notification auth

# 3. Démarrer Candidate (pour l'onboarding CV et le profil)
docker-compose -f docker-compose.dev.yml up -d candidate

# 4. (Recommandé) Démarrer Document + MinIO pour l'upload de CV et photos de profil
# Le service Document nécessite MinIO (stockage S3). MinIO démarre automatiquement avec document.
docker-compose -f docker-compose.dev.yml up -d minio document
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

# Document (port 8003) - nécessite MinIO pour les uploads
curl -s http://localhost:8003/health
# doit retourner du JSON (ex: {"status":"healthy","service":"document-service",...})
```

### Diagnostic : erreurs 500 sur le service Document (photos, CV)

Si vous obtenez des erreurs 500 sur `/api/v1/documents/candidate/...` ou `/api/v1/documents/upload/profile-photo` :

**1. Vérifier que MinIO et Document sont démarrés :**
```bash
docker-compose -f docker-compose.dev.yml up -d minio document
```

**2. Vérifier les logs du service Document :**
```bash
docker-compose -f docker-compose.dev.yml logs document --tail=50
```

**3. Causes fréquentes :**
- **MinIO non démarré** : le service Document a besoin de MinIO pour stocker les fichiers
- **Table documents manquante** : redémarrer le service Document pour créer les tables

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

### Effacer les données candidats (tests)

Pour réinitialiser uniquement les données candidats en développement :

```bash
./scripts/wipe-candidate-data.sh
```

Options :
- `--with-users` : supprime aussi les comptes candidats (auth)
- `--with-es` : vide l'index Elasticsearch `certified_candidates`
- `--all` : `--with-users` + `--with-es`
- `-y` : confirmer sans demander

Exécution directe (sans Docker) : `python3 scripts/wipe_candidate_data.py` (nécessite asyncpg, python-dotenv, httpx).

### Option sans Docker : lancer Auth avec uvicorn

Si vous préférez lancer le service Auth sans Docker (avec une base PostgreSQL et Redis déjà en cours d'exécution) :

```bash
cd services/auth-service
pip install -r requirements.txt
# Configurer DATABASE_URL, REDIS_URL, JWT_SECRET_KEY dans .env ou export
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Page Reset Password

Pour que `/reset-password` fonctionne : `docker-compose -f docker-compose.dev.yml up -d nginx auth postgres`. Sans nginx : `VITE_PROXY_TARGET=http://localhost:8001` dans `.env`.

Le frontend doit alors être servi depuis `http://localhost:3000` (Vite) pour que l’URL par défaut `http://localhost:8001` soit utilisée pour l’API Auth.

### Connexion Google / LinkedIn (OAuth)

Pour activer les boutons « Continuer avec Google » et « Continuer avec LinkedIn » sur `/register/candidat` et `/login` :

1. **Google** : [Console Google Cloud](https://console.cloud.google.com/apis/credentials) → Créer des identifiants OAuth 2.0 (type Web). Ajouter l'URI de redirection : `http://localhost:8001/api/v1/auth/oauth/google/callback`
2. **LinkedIn** : [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) → Créer une app → Activer « Sign In with LinkedIn » → Ajouter l'URI : `http://localhost:8001/api/v1/auth/oauth/linkedin/callback`
3. Dans `.env` : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `AUTH_SERVICE_EXTERNAL_URL=http://localhost:8001`
4. Migration : exécuter **dans Docker** (recommandé) :
   ```bash
   docker-compose -f docker-compose.dev.yml exec auth alembic upgrade head
   ```
   Ou en local (si Postgres Docker est exposé sur le port 5433) :
   ```bash
   cd services/auth-service
   # .env doit avoir : DB_USER=postgres, DB_PASSWORD=postgres, DB_NAME=yemma_db, DB_HOST=localhost, DB_PORT=5433
   alembic upgrade head
   ```
