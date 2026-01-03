# Sécurité du Stockage des Documents

Ce document décrit les améliorations de sécurité implémentées pour le stockage des documents dans la plateforme Yemma.

## 1. Server-Side Encryption (SSE)

### Configuration

Le service Document implémente le **Server-Side Encryption (SSE)** pour tous les fichiers uploadés vers S3/MinIO.

#### Variables d'environnement

```bash
# Algorithm d'encryption (AES256 pour MinIO, aws:kms pour AWS S3)
S3_SERVER_SIDE_ENCRYPTION=AES256

# KMS Key ID (uniquement si S3_SERVER_SIDE_ENCRYPTION=aws:kms)
# S3_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012
```

### Implémentation

1. **Configuration du bucket** : Lors de la création du bucket, l'encryption par défaut est configurée automatiquement.

2. **Upload avec encryption** : Chaque fichier uploadé utilise le paramètre `ServerSideEncryption` dans `put_object()`.

3. **Support KMS** : Si `aws:kms` est utilisé, la clé KMS est spécifiée dans les paramètres d'upload.

### Fichiers modifiés

- `services/document/app/core/config.py` : Ajout des variables `S3_SERVER_SIDE_ENCRYPTION` et `S3_KMS_KEY_ID`
- `services/document/app/infrastructure/storage.py` : 
  - Méthode `_configure_bucket_encryption()` pour configurer l'encryption du bucket
  - Méthode `upload_file()` modifiée pour inclure `ServerSideEncryption`

## 2. Script de Nettoyage Automatique

### Endpoint API

Un endpoint d'administration a été créé pour nettoyer les documents REJECTED :

**POST `/api/v1/admin/cleanup/rejected`**

- **Paramètres** :
  - `days_old` (query, optionnel) : Nombre de jours après lesquels supprimer (défaut: 30)
- **Authentification** : Token de service interne requis
- **Réponse** :
  ```json
  {
    "deleted_count": 5,
    "errors": [],
    "cutoff_date": "2024-01-01T00:00:00",
    "message": "Successfully deleted 5 rejected documents older than 30 days"
  }
  ```

### Script CLI

Un script Python est disponible pour exécuter le nettoyage via cron ou Celery Beat :

**`services/document/scripts/cleanup_rejected_documents.py`**

#### Utilisation

```bash
# Nettoyage avec 30 jours par défaut
python services/document/scripts/cleanup_rejected_documents.py

# Nettoyage avec un nombre de jours personnalisé
python services/document/scripts/cleanup_rejected_documents.py --days 60
```

#### Configuration Cron

Pour exécuter le nettoyage automatiquement tous les jours à 2h du matin :

```cron
0 2 * * * cd /path/to/yemma-solutions && python services/document/scripts/cleanup_rejected_documents.py --days 30
```

#### Configuration Celery Beat

Pour utiliser Celery Beat, ajoutez une tâche périodique dans `celery_app.py` :

```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'cleanup-rejected-documents': {
        'task': 'app.tasks.cleanup_rejected_documents',
        'schedule': crontab(hour=2, minute=0),  # Tous les jours à 2h
    },
}
```

### Fichiers créés/modifiés

- `services/document/app/api/v1/admin.py` : Nouveau fichier avec les endpoints d'administration
- `services/document/scripts/cleanup_rejected_documents.py` : Script CLI de nettoyage
- `services/document/app/main.py` : Ajout du router admin

## 3. Fonctionnalité d'Anonymisation de Compte (RGPD)

### Endpoint API

Un endpoint permet aux utilisateurs d'anonymiser leur compte conformément au RGPD :

**POST `/api/v1/users/anonymize`**

- **Authentification** : Token JWT utilisateur requis
- **Actions effectuées** :
  1. Remplace l'email par `anon_{random_string}@anonymized.local`
  2. Remplace le prénom et nom par des chaînes aléatoires
  3. Désactive le compte (status = "inactive")
  4. Supprime tous les documents de l'utilisateur (via Document Service)
  5. Révoque tous les tokens de l'utilisateur
  6. Conserve les logs d'audit (sans données personnelles) pour la cohérence des quotas

- **Réponse** :
  ```json
  {
    "message": "Account successfully anonymized",
    "anonymized_at": "2024-01-15T10:30:00",
    "note": "All personal data has been anonymized. Audit logs are preserved without personal information."
  }
  ```

### Implémentation

1. **Anonymisation des données** : Utilise `secrets.choice()` pour générer des chaînes aléatoires sécurisées.

2. **Suppression des documents** : Appelle le Document Service via HTTP interne pour supprimer tous les documents de l'utilisateur.

3. **Conservation des logs** : Les logs d'audit sont conservés mais sans données personnelles (email, nom), permettant de maintenir la cohérence des quotas.

### Fichiers créés/modifiés

- `services/auth-service/app/api/v1/anonymization.py` : Nouveau fichier avec l'endpoint d'anonymisation
- `services/auth-service/app/core/config.py` : Ajout de `DOCUMENT_SERVICE_URL` et `INTERNAL_SERVICE_TOKEN_SECRET`
- `services/auth-service/app/main.py` : Ajout du router d'anonymisation
- `services/document/app/api/v1/admin.py` : Endpoint `DELETE /api/v1/admin/candidate/{candidate_id}` pour supprimer les documents d'un candidat

## Configuration

### Variables d'environnement requises

#### Document Service

```bash
# Encryption
S3_SERVER_SIDE_ENCRYPTION=AES256
# S3_KMS_KEY_ID=arn:aws:kms:... (si aws:kms)

# Service URLs
DOCUMENT_SERVICE_URL=http://document-service:8000
INTERNAL_SERVICE_TOKEN_SECRET=your-secret-key
```

#### Auth Service

```bash
# Service URLs
DOCUMENT_SERVICE_URL=http://document-service:8000
INTERNAL_SERVICE_TOKEN_SECRET=your-secret-key
```

## Sécurité

### Bonnes pratiques

1. **Encryption** : Tous les fichiers sont automatiquement chiffrés lors de l'upload.

2. **Nettoyage automatique** : Les documents REJECTED sont supprimés après 30 jours pour réduire l'exposition des données.

3. **Anonymisation RGPD** : Les utilisateurs peuvent demander l'anonymisation de leur compte, conformément au RGPD.

4. **Tokens internes** : Les endpoints d'administration sont protégés par des tokens de service interne.

5. **Soft Delete** : Les documents sont marqués comme supprimés (soft delete) plutôt que supprimés définitivement, permettant une récupération si nécessaire.

## Tests

### Tester l'encryption

1. Uploader un document via `/api/v1/documents/upload`
2. Vérifier dans MinIO/AWS S3 que le fichier a bien l'attribut `ServerSideEncryption`

### Tester le nettoyage

```bash
# Via l'endpoint API (nécessite un token de service)
curl -X POST "http://localhost:8003/api/v1/admin/cleanup/rejected?days_old=30" \
  -H "X-Service-Token: <token>" \
  -H "X-Service-Name: admin-service"

# Via le script CLI
python services/document/scripts/cleanup_rejected_documents.py --days 30
```

### Tester l'anonymisation

```bash
# Se connecter et obtenir un token
TOKEN=$(curl -X POST "http://localhost:8001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' \
  | jq -r '.access_token')

# Anonymiser le compte
curl -X POST "http://localhost:8001/api/v1/users/anonymize" \
  -H "Authorization: Bearer $TOKEN"
```

## Notes importantes

- ⚠️ **MinIO** : MinIO peut ne pas supporter toutes les options d'encryption AWS (notamment KMS). L'encryption AES256 est recommandée pour MinIO.

- ⚠️ **Production** : Assurez-vous de configurer correctement les secrets (`INTERNAL_SERVICE_TOKEN_SECRET`, `S3_KMS_KEY_ID`) en production.

- ⚠️ **Rétention** : La politique de rétention de 30 jours est configurable via le paramètre `days_old`.

- ⚠️ **Anonymisation** : Une fois un compte anonymisé, il ne peut plus être utilisé. L'utilisateur devra créer un nouveau compte s'il souhaite continuer à utiliser la plateforme.

