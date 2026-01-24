# Document Service

Service de gestion et stockage des documents pour la plateforme de recrutement Yemma Solutions.

## 🎯 Vue d'ensemble

Le service document gère l'upload, le stockage et la récupération de tous les documents de la plateforme (CV, diplômes, attestations, photos de profil, etc.) avec stockage S3/MinIO et génération de liens présignés sécurisés.

## ✨ Fonctionnalités

- ✅ Upload de documents (PDF, JPG, PNG, max 10MB)
- ✅ Validation par Magic Numbers pour la sécurité
- ✅ Stockage S3/MinIO avec Boto3
- ✅ Génération de liens présignés temporaires (24h par défaut)
- ✅ Association documents-candidats
- ✅ Gestion des types de documents
- ✅ Upload de photos de profil avec URLs permanentes
- ✅ Upload de logos d'entreprise
- ✅ Soft delete pour la traçabilité
- ✅ Gestion des métadonnées (taille, type MIME, nom original)

## 📁 Structure

```
services/document/
├── app/
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── api/v1/
│   │   └── documents.py          # Endpoints documents
│   ├── core/
│   │   ├── config.py             # Configuration
│   │   └── exceptions.py         # Gestion des erreurs
│   ├── domain/
│   │   ├── models.py             # Modèles SQLModel
│   │   └── schemas.py            # Schémas Pydantic
│   └── infrastructure/
│       ├── storage.py             # Gestion S3/MinIO
│       ├── file_validator.py     # Validation des fichiers
│       └── database.py           # Configuration DB
├── Dockerfile
├── requirements.txt
└── README.md
```

## 📊 Modèle de données

### Document

Modèle principal représentant un document :

- `id` : ID unique
- `candidate_id` : ID du candidat (optionnel, pour documents candidat)
- `company_id` : ID de l'entreprise (optionnel, pour logos)
- `document_type` : Type de document (CV, ATTESTATION, etc.)
- `original_filename` : Nom original du fichier
- `file_size` : Taille en octets
- `mime_type` : Type MIME du fichier
- `s3_key` : Clé S3/MinIO du fichier
- `status` : Statut (uploaded, processing, error)
- `created_at` : Date de création
- `updated_at` : Date de mise à jour
- `deleted_at` : Date de suppression (soft delete)

## 🚀 Endpoints

### POST /api/v1/documents/upload

Upload un document.

**Paramètres (form-data) :**
- `file` : Fichier à uploader (PDF, JPG, PNG, max 10MB)
- `candidate_id` : ID du candidat (optionnel)
- `company_id` : ID de l'entreprise (optionnel, pour logos)
- `document_type` : Type de document (CV, ATTESTATION, CERTIFICATE, etc.)

**Réponse :**
```json
{
  "id": 1,
  "candidate_id": 123,
  "document_type": "CV",
  "original_filename": "cv.pdf",
  "file_size": 1024000,
  "mime_type": "application/pdf",
  "status": "uploaded",
  "message": "Document uploaded successfully"
}
```

### POST /api/v1/documents/upload/profile-photo

Upload une photo de profil candidat.

**Paramètres (form-data) :**
- `file` : Image (JPG, PNG, max 5MB)
- `candidate_id` : ID du candidat (requis)

**Réponse :**
```json
{
  "id": 1,
  "candidate_id": 123,
  "document_type": "PROFILE_PHOTO",
  "serve_url": "https://...",
  "message": "Profile photo uploaded successfully"
}
```

### POST /api/v1/documents/upload/company-logo

Upload un logo d'entreprise.

**Paramètres (form-data) :**
- `file` : Image (JPG, PNG, max 5MB)
- `company_id` : ID de l'entreprise (requis)

**Réponse :**
```json
{
  "id": 1,
  "company_id": 456,
  "document_type": "COMPANY_LOGO",
  "url": "https://...",
  "message": "Company logo uploaded successfully"
}
```

### GET /api/v1/documents/view/{document_id}

Génère un lien présigné temporaire pour visualiser un document.

**Réponse :**
```json
{
  "document_id": 1,
  "view_url": "https://s3.amazonaws.com/bucket/key?signature=...",
  "expires_at": "2024-01-02T12:00:00",
  "expires_in_seconds": 86400
}
```

### GET /api/v1/documents/{document_id}

Récupère les informations d'un document.

**Réponse :**
```json
{
  "id": 1,
  "candidate_id": 123,
  "document_type": "CV",
  "original_filename": "cv.pdf",
  "file_size": 1024000,
  "mime_type": "application/pdf",
  "status": "uploaded",
  "created_at": "2024-01-01T10:00:00"
}
```

### GET /api/v1/documents/candidate/{candidate_id}

Récupère tous les documents d'un candidat.

**Réponse :**
```json
[
  {
    "id": 1,
    "document_type": "CV",
    "original_filename": "cv.pdf",
    "file_size": 1024000,
    "mime_type": "application/pdf",
    "created_at": "2024-01-01T10:00:00"
  },
  {
    "id": 2,
    "document_type": "DIPLOMA",
    "original_filename": "diplome.pdf",
    "file_size": 512000,
    "mime_type": "application/pdf",
    "created_at": "2024-01-02T14:00:00"
  }
]
```

### DELETE /api/v1/documents/{document_id}

Supprime un document (soft delete).

**Permissions** : Propriétaire du document ou admin

## 📄 Types de documents

### Documents candidat
- `CV` : Curriculum Vitae
- `ATTESTATION` : Attestation de travail
- `CERTIFICATE` : Certificat
- `RECOMMENDATION_LETTER` : Lettre de recommandation
- `DIPLOMA` : Diplôme
- `PROFILE_PHOTO` : Photo de profil
- `OTHER` : Autre document

### Documents entreprise
- `COMPANY_LOGO` : Logo de l'entreprise

## 🔒 Validation des fichiers

Le service valide les fichiers à plusieurs niveaux pour garantir la sécurité :

### 1. Taille
- Maximum 10MB pour les documents généraux
- Maximum 5MB pour les photos de profil et logos

### 2. Extension
- PDF, JPG, JPEG, PNG uniquement
- Validation stricte de l'extension

### 3. Magic Numbers
Vérification du contenu réel du fichier pour éviter les fichiers malveillants :

- **PDF** : `%PDF` au début
- **JPEG** : `FF D8 FF` au début
- **PNG** : `89 50 4E 47` au début

### 4. Type MIME
Vérification de la cohérence entre extension et type MIME réel.

## 🔐 Sécurité

- ✅ Validation par Magic Numbers pour éviter les fichiers malveillants
- ✅ Limitation de taille (10MB documents, 5MB photos/logos)
- ✅ Types de fichiers restreints (PDF, JPG, PNG uniquement)
- ✅ Liens présignés temporaires (24h par défaut, configurable)
- ✅ Soft delete pour la traçabilité
- ✅ Validation des permissions (propriétaire ou admin)
- ✅ Stockage sécurisé dans S3/MinIO avec accès contrôlé

## ⚙️ Configuration

Variables d'environnement :

```env
# S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=documents
S3_REGION=us-east-1
S3_USE_SSL=false

# File Upload
MAX_FILE_SIZE=10485760  # 10MB en octets
MAX_PHOTO_SIZE=5242880  # 5MB en octets
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png
TEMP_LINK_EXPIRE_HOURS=24

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=yemma_document_db

# JWT
JWT_SECRET_KEY=your-secret-key
AUTH_SERVICE_URL=http://localhost:8001

# Services
CANDIDATE_SERVICE_URL=http://localhost:8002
COMPANY_SERVICE_URL=http://localhost:8005
```

## 🛠️ Développement

### Installation locale

```bash
# Installer les dépendances
pip install -r requirements.txt

# Démarrer MinIO localement (optionnel, si pas de Docker)
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# Démarrer le service
uvicorn app.main:app --reload --port 8003
```

### Avec Docker

```bash
# Build et démarrage
docker-compose up document-service

# Voir les logs
docker-compose logs -f document-service
```

## 📦 Stockage S3/MinIO

### Structure des clés S3

- **Documents candidat** : `candidates/{candidate_id}/{document_type}/{filename}`
- **Photos de profil** : `candidates/{candidate_id}/profile_photo/{filename}`
- **Logos entreprise** : `companies/{company_id}/logo/{filename}`

### URLs permanentes

Les photos de profil et logos utilisent des URLs permanentes qui sont régénérées automatiquement si elles expirent.

### Liens présignés

Les documents sensibles (CV, diplômes) utilisent des liens présignés temporaires pour un accès sécurisé.

## 🧪 Tests

```bash
# Exécuter les tests
pytest

# Avec couverture
pytest --cov=app
```

## 📝 Exemples d'utilisation

### Upload d'un CV

```bash
curl -X POST http://localhost:8003/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@cv.pdf" \
  -F "candidate_id=123" \
  -F "document_type=CV"
```

### Upload d'une photo de profil

```bash
curl -X POST http://localhost:8003/api/v1/documents/upload/profile-photo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@photo.jpg" \
  -F "candidate_id=123"
```

### Récupérer un lien de visualisation

```bash
curl -X GET http://localhost:8003/api/v1/documents/view/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚀 Prochaines étapes

- [ ] Ajouter la compression d'images automatique
- [ ] Implémenter la génération de thumbnails
- [ ] Ajouter le support de plus de types de fichiers
- [ ] Implémenter le versioning des documents
- [ ] Ajouter la détection de contenu (OCR pour extraction de texte)
- [ ] Implémenter le watermarking pour les documents sensibles

---

**Service développé pour Yemma Solutions**
