# Instructions de migration : Database per Service

Ce document décrit comment migrer les données de l'ancienne base PostgreSQL unique (`yemma_db`) vers l'architecture Database per Service sans perte de données.

## Résumé du plan d'action final

1. **Lancer l'infra vide** : `docker-compose up -d postgres-auth postgres-candidate ...`
2. **Migrer les données** : Script corrigé (sans tables `alembic_version*`).
3. **Initialiser l'état Alembic** : `alembic stamp head` pour auth, candidate, notification, audit.
4. **Vérifier** : Compter les lignes, contrôler les tables `alembic_version`.
5. **Démarrer** : `docker-compose up -d`.

---

## Prérequis

- Accès à l'ancienne base de données : conteneur `yemma-postgres` (ex. via `docker-compose.dev.yml`) ou fichier backup existant.  
  Si le conteneur n'existe pas : `docker ps -a | grep postgres` pour lister les conteneurs, ou démarrer l'ancienne stack (`docker-compose -f docker-compose.dev.yml up -d postgres`) pour créer le dump.
- Les nouveaux conteneurs PostgreSQL démarrés (`postgres-auth`, `postgres-candidate`, etc.)
- Outils : `pg_dump`, `pg_restore` ou `psql` (disponibles dans les images postgres)

## Cartographie des tables par service

| Service | Base cible | Tables à migrer (données métier uniquement) |
|---------|------------|---------------------------------------------|
| **auth** | auth_db | users, roles, user_roles, refresh_tokens, admin_invitation_tokens |
| **candidate** | candidate_db | profiles, experiences, educations, certifications, skills, job_preferences |
| **company** | company_db | companies, team_members, invitations |
| **payment** | payment_db | plans, subscriptions, payments, invoices, quotas |
| **document** | document_db | documents |
| **notification** | logs_db | notifications |
| **audit** | logs_db | access_logs |

> **Important** : On ne migre **jamais** les tables `alembic_version*` depuis l'ancienne base (structure différente ou inexistante). On utilise `alembic stamp head` après la migration pour initialiser proprement l'état Alembic.

---

## Étape 1 : Arrêter les services et sauvegarder l'ancienne base

```bash
# 1. Arrêter tous les services backend (garder postgres si encore l'ancien)
docker-compose stop auth candidate company payment document notification notification-worker audit

# 2. Créer un dump complet depuis l'ancien postgres
#    Nom du conteneur : yemma-postgres (docker-compose.dev) ou vérifier avec : docker ps -a | grep postgres
docker exec yemma-postgres pg_dump -U postgres -d yemma_db -F c -f /tmp/yemma_full_backup.dump

# 3. Copier le dump hors du conteneur
docker cp yemma-postgres:/tmp/yemma_full_backup.dump ./yemma_full_backup.dump
```

---

## Étape 2 : Démarrer la nouvelle architecture (sans les services backend)

```bash
# Démarrer uniquement les nouvelles bases PostgreSQL + infra
docker-compose up -d postgres-auth postgres-candidate postgres-company postgres-payment postgres-document postgres-logs redis minio elasticsearch kibana

# Attendre que toutes les bases soient healthy
docker-compose ps
```

---

## Étape 3 : Migrer les données par service

> **⚠️ Choisir UNE SEULE option (A ou B)** : ne pas exécuter les deux. Les bases cibles doivent être **vides** avant la migration. Si vous avez déjà exécuté pg_restore, ne pas relancer Option B (conflits "relation already exists").

Utilisez `pg_restore` avec l'option `-t` pour restaurer uniquement les tables concernées. Les variables `DB_USER` et `DB_PASSWORD` doivent correspondre à votre `.env`.

### Option A : Migration depuis un dump complet

> **Données métier uniquement** : pas de tables `alembic_version*` (voir Étape 3b pour le stamping).

```bash
# Variables (ajuster selon votre .env)
export PGUSER=${DB_USER:-postgres}
export PGPASSWORD=${DB_PASSWORD:-postgres}

# Auth
docker exec -i yemma-postgres-auth pg_restore -U $PGUSER -d auth_db --clean --if-exists -t users -t roles -t user_roles -t refresh_tokens -t admin_invitation_tokens < yemma_full_backup.dump 2>/dev/null || true

# Candidate
docker exec -i yemma-postgres-candidate pg_restore -U $PGUSER -d candidate_db --clean --if-exists -t profiles -t experiences -t educations -t certifications -t skills -t job_preferences < yemma_full_backup.dump 2>/dev/null || true

# Company
docker exec -i yemma-postgres-company pg_restore -U $PGUSER -d company_db --clean --if-exists -t companies -t team_members -t invitations < yemma_full_backup.dump 2>/dev/null || true

# Payment
docker exec -i yemma-postgres-payment pg_restore -U $PGUSER -d payment_db --clean --if-exists -t plans -t subscriptions -t payments -t invoices -t quotas < yemma_full_backup.dump 2>/dev/null || true

# Document
docker exec -i yemma-postgres-document pg_restore -U $PGUSER -d document_db --clean --if-exists -t documents < yemma_full_backup.dump 2>/dev/null || true

# Logs (notification + audit)
docker exec -i yemma-postgres-logs pg_restore -U $PGUSER -d logs_db --clean --if-exists -t notifications -t access_logs < yemma_full_backup.dump 2>/dev/null || true
```

### Option B : Migration depuis l'ancien conteneur postgres en cours d'exécution

Si l'ancien conteneur `yemma-postgres` est encore actif avec la base `yemma_db`.  
**Format SQL texte** (`pg_dump` sans `-F c`) + `psql` : plus robuste pour le pipe entre conteneurs.  
**Données métier uniquement** : pas de tables `alembic_version*` (elles n'existent souvent pas dans la source ou ont une structure différente).

```bash
# --- AUTH ---
docker exec yemma-postgres pg_dump -U postgres -d yemma_db -t users -t roles -t user_roles -t refresh_tokens -t admin_invitation_tokens | \
  docker exec -i yemma-postgres-auth psql -U postgres -d auth_db

# --- CANDIDATE ---
docker exec yemma-postgres pg_dump -U postgres -d yemma_db -t profiles -t experiences -t educations -t certifications -t skills -t job_preferences | \
  docker exec -i yemma-postgres-candidate psql -U postgres -d candidate_db

# --- COMPANY ---
docker exec yemma-postgres pg_dump -U postgres -d yemma_db -t companies -t team_members -t invitations | \
  docker exec -i yemma-postgres-company psql -U postgres -d company_db

# --- PAYMENT ---
docker exec yemma-postgres pg_dump -U postgres -d yemma_db -t plans -t subscriptions -t payments -t invoices -t quotas | \
  docker exec -i yemma-postgres-payment psql -U postgres -d payment_db

# --- DOCUMENT ---
docker exec yemma-postgres pg_dump -U postgres -d yemma_db -t documents | \
  docker exec -i yemma-postgres-document psql -U postgres -d document_db

# --- LOGS (Notification + Audit) ---
docker exec yemma-postgres pg_dump -U postgres -d yemma_db -t notifications -t access_logs | \
  docker exec -i yemma-postgres-logs psql -U postgres -d logs_db
```

> **Note** : Les warnings `psql: NOTICE: relation "xxx" does not exist` sont normaux si les tables n'existent pas encore. Les erreurs sur les contraintes peuvent apparaître ; relancer la commande après création des tables par les services si besoin.

---

## Étape 3b : Alembic et création des tables

Deux cas possibles selon que vous migrez des données existantes ou partez de zéro.

### Cas A : Migration depuis l'ancienne base (données existantes)

Une fois les données migrées (Option A ou B), **stamp** pour indiquer à Alembic que le schéma est déjà à jour :

```bash
# Auth, notification, audit
docker-compose run --rm auth alembic stamp head
docker-compose run --rm notification alembic stamp head
docker-compose run --rm audit alembic stamp head

# Candidate : contournement (PYTHONPATH=/app masque le package alembic installé)
docker-compose run --rm -e PYTHONPATH= candidate alembic -c /app/alembic.ini stamp head
```

### Cas B : Installation sans migration (bases vides)

Si vous partez de zéro (pas de dump à restaurer) :

1. **Candidate** : exécuter les migrations Alembic pour créer les tables :
   ```bash
   docker-compose run --rm -e PYTHONPATH= candidate alembic -c /app/alembic.ini upgrade head
   ```

2. **Company, payment, document, notification, audit** : démarrer les services pour créer les tables via `create_all` :
   ```bash
   docker-compose up -d company payment document notification audit
   # Attendre ~30s que les services soient healthy, puis vérifier
   ```

3. **Auth** : déjà migré ou créé manuellement.

> **Erreurs Alembic candidate** : `relation "xxx" already exists`, `type "profilestatus" already exists`, ou tables non créées après un mauvais `stamp head`. **Réinitialiser tout le schéma** (supprime tables + types ENUM) puis relancer :
> ```bash
> docker exec yemma-postgres-candidate psql -U postgres -d candidate_db -c "
> DROP SCHEMA public CASCADE;
> CREATE SCHEMA public;
> GRANT ALL ON SCHEMA public TO postgres;
> GRANT ALL ON SCHEMA public TO public;
> "
> docker-compose run --rm -e PYTHONPATH= candidate alembic -c /app/alembic.ini upgrade head
> ```

> **Important** : Reconstruire les images notification et audit si Alembic a été ajouté :
> ```bash
> docker-compose build --no-cache notification audit
> ```

---

## Étape 4 : Vérifications post-migration

```bash
# Vérifier le nombre de lignes dans chaque base
docker exec yemma-postgres-auth psql -U postgres -d auth_db -c "SELECT 'users' as tbl, count(*) FROM users UNION ALL SELECT 'roles', count(*) FROM roles;"
docker exec yemma-postgres-candidate psql -U postgres -d candidate_db -c "SELECT count(*) FROM profiles;"
docker exec yemma-postgres-company psql -U postgres -d company_db -c "SELECT count(*) FROM companies;"
docker exec yemma-postgres-payment psql -U postgres -d payment_db -c "SELECT count(*) FROM subscriptions;"
docker exec yemma-postgres-document psql -U postgres -d document_db -c "SELECT count(*) FROM documents;"
docker exec yemma-postgres-logs psql -U postgres -d logs_db -c "SELECT 'notifications' as tbl, count(*) FROM notifications UNION ALL SELECT 'access_logs', count(*) FROM access_logs;"

# Vérification : tables alembic_version (après stamp head, doivent contenir une ligne)
docker exec yemma-postgres-auth psql -U postgres -d auth_db -c "SELECT * FROM alembic_version_auth;"
docker exec yemma-postgres-candidate psql -U postgres -d candidate_db -c "SELECT * FROM alembic_version;"
docker exec yemma-postgres-logs psql -U postgres -d logs_db -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'alembic_version%';"
```

---

## Étape 6 : Démarrer tous les services

```bash
docker-compose up -d
```

---

## Checklist finale avant `docker-compose up`

- [ ] **Variables d'environnement** : Le fichier `.env` à la racine contient `DB_USER` et `DB_PASSWORD` utilisés dans le docker-compose.
- [ ] **Réseau externe** : Le réseau `yemma-network` existe. Si absent :
  ```bash
  docker network create yemma-network
  ```
- [ ] **Volumes** : Aucun volume orphelin conflictuel. Vérifier avec `docker volume ls` si besoin.
- [ ] **Migration des données** : Les scripts Option A ou B ont été exécutés avec succès.
- [ ] **Stamping Alembic** : Les commandes `alembic stamp head` ont été exécutées (rebuild `notification` et `audit` avec `--no-cache` avant).
- [ ] **Vérifications** : Les comptages de lignes et tables `alembic_version` sont cohérents.

---

## Procédure de lancement recommandée (par étapes)

Ne pas lancer tout d'un coup. Procéder ainsi pour isoler les erreurs :

```bash
# 1. Infrastructure uniquement (~30s d'attente)
docker-compose up -d postgres-auth postgres-candidate postgres-company postgres-payment postgres-document postgres-logs redis elasticsearch minio
docker-compose ps   # Vérifier que tout est healthy

# 2. Migration des données (Option A ou B du guide ci-dessus)

# 3a. Si migration de données : stamp Alembic
# 3b. Si bases vides : candidate upgrade head, puis démarrer company/payment/document/notification/audit
#     (voir Étape 3b du guide pour le détail)

# 4. Vérifications (comptages, alembic_version)

# 5. Services backend
docker-compose up -d auth candidate company payment document notification audit

# 6. Vérification des logs (chercher erreurs DB ou Alembic)
docker-compose logs -f auth
# Ctrl+C puis :
docker-compose logs -f candidate
```

```bash
# 7. Reste de la stack (nginx, frontend, workers, parsing...)
docker-compose up -d
```

---

## Cas particulier : Première installation (sans données existantes)

Si vous déployez pour la première fois sans ancienne base :

1. Supprimez toute référence à l'ancien volume `postgres_data` dans votre projet.
2. Lancez `docker-compose up -d`.
3. Les services créeront les tables via `init_db()` et/ou `alembic upgrade head` au démarrage.

---

## Dépannage : base corrompue après migration

Si auth_db (ou une autre) présente des erreurs (`relation "users" does not exist`, `type "userstatus" does not exist`, doublons), réinitialiser la base puis migrer à nouveau :

```bash
# Exemple pour auth_db : supprimer et recréer la base
docker exec yemma-postgres-auth psql -U postgres -c "DROP DATABASE IF EXISTS auth_db;"
docker exec yemma-postgres-auth psql -U postgres -c "CREATE DATABASE auth_db;"

# Puis relancer UNE SEULE fois la migration (Option B recommandée pour bases vides)
docker exec yemma-postgres pg_dump -U postgres -d yemma_db -t users -t roles -t user_roles -t refresh_tokens -t admin_invitation_tokens | \
  docker exec -i yemma-postgres-auth psql -U postgres -d auth_db
```

---

## Rollback (retour à l'architecture monolithique)

En cas de problème, pour revenir à une base unique :

1. Restaurer l'ancien `docker-compose.yml` (avec le service `postgres` unique).
2. Restaurer le volume `postgres_data` depuis un backup.
3. Redémarrer les services avec les variables `DB_HOST=postgres` et `DB_NAME=yemma_db`.

---

## Estimation mémoire (VPS 8 Go)

| Composant | RAM estimée |
|-----------|-------------|
| postgres-auth (64MB shared_buffers) | ~150 MB |
| postgres-candidate (128MB shared_buffers) | ~250 MB |
| postgres-company (64MB) | ~150 MB |
| postgres-payment (32MB) | ~100 MB |
| postgres-document (32MB) | ~100 MB |
| postgres-logs (64MB) | ~150 MB |
| Redis (256MB max) | ~256 MB |
| Elasticsearch (512MB heap) | ~700 MB |
| Services Python (×10) | ~1.5–2 GB |
| Nginx, Frontend, MinIO, Kibana | ~500 MB |
| **Total** | ~4–5 GB |

Marge restante pour le système et pics de charge : ~3 Go.
