# Document Service

Service de gestion et stockage des documents pour la plateforme de recrutement.

## Fonctionnalités

- ✅ Upload de documents (PDF, JPG, PNG, max 10MB)
- ✅ Validation par Magic Numbers pour la sécurité
- ✅ Stockage S3/MinIO avec Boto3
- ✅ Génération de liens présignés temporaires
- ✅ Association documents-candidats
- ✅ Gestion des types de documents

## Structure

```
services/document/
├── app/
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── api/
│   │   └── v1/
│   │       └── documents.py      # Endpoints
│   ├── core/
│   │   ├── config.py             # Configuration
│   │   └── exceptions.py         # Gestion des erreurs
│   ├── domain/
│   │   ├── models.py             # Modèles SQLModel
│   │   └── schemas.py            # Schémas Pydantic
│   └── infrastructure/
│       ├── storage.py             # Gestion S3/MinIO
│       ├── file_validator.py     # Validation des fichiers
│       └── database.py            # Configuration DB
├── Dockerfile
├── requirements.txt
└── README.md
```

## Endpoints

### POST /api/v1/documents/upload

Upload un document.

**Paramètres :**
- `file` (form-data): Fichier à uploader (PDF, JPG, PNG, max 10MB)
- `candidate_id` (form-data): ID du candidat
- `document_type` (form-data): Type de document (CV, ATTESTATION, etc.)

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

### GET /api/v1/documents/view/{document_id}

Génère un lien présigné temporaire pour visualiser un document.

**Réponse :**
```json
{
  "document_id": 1,
  "view_url": "https://...",
  "expires_at": "2024-01-01T12:00:00",
  "expires_in_seconds": 86400
}
```

### GET /api/v1/documents/{document_id}

Récupère les informations d'un document.

### GET /api/v1/documents/candidate/{candidate_id}

Récupère tous les documents d'un candidat.

## Types de documents

- `CV` : Curriculum Vitae
- `ATTESTATION` : Attestation de travail
- `CERTIFICATE` : Certificat
- `RECOMMENDATION_LETTER` : Lettre de recommandation
- `DIPLOMA` : Diplôme
- `OTHER` : Autre

## Validation des fichiers

Le service valide les fichiers à plusieurs niveaux :

1. **Taille** : Maximum 10MB
2. **Extension** : PDF, JPG, JPEG, PNG uniquement
3. **Magic Numbers** : Vérification du contenu réel du fichier
4. **Type MIME** : Vérification de la cohérence extension/MIME type

## Configuration

Variables d'environnement :

```env
# S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=documents

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png
TEMP_LINK_EXPIRE_HOURS=24
```

## Développement

```bash
# Installer les dépendances
pip install -r requirements.txt

# Démarrer le service
uvicorn app.main:app --reload --port 8003
```

## Docker

```bash
# Build et démarrage
docker-compose up document
```

## Sécurité

- Validation par Magic Numbers pour éviter les fichiers malveillants
- Limitation de taille (10MB)
- Types de fichiers restreints
- Liens présignés temporaires (24h par défaut)
- Soft delete pour la traçabilité

