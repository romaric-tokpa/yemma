# Yemma Parsing Service

Microservice de parsing de CV via HRFlow.ai pour la plateforme Yemma.

## Description

Ce service parse les CVs uploadés par les candidats et extrait les données structurées :
- **Profil** : nom, email, téléphone, titre professionnel, résumé
- **Expériences** : entreprise, poste, dates, description, réalisations
- **Formations** : diplôme, établissement, année d'obtention, niveau
- **Compétences** : nom, type (technique/soft/outil), niveau de maîtrise

## Technologies

- **FastAPI** : Framework web Python
- **HRFlow.ai** : API de parsing de CV
- **Celery + Redis** : Traitement asynchrone
- **Pydantic** : Validation des données

## Configuration

Variables d'environnement requises :

```env
# HRFlow API
HRFLOW_API_KEY=your_api_key
HRFLOW_SOURCE_KEY=ae16505f6f0eebe3abb79ad1bf83ec53b4886432

# Redis (pour Celery)
REDIS_URL=redis://redis:6379/0

# Database (optionnel)
DATABASE_URL=postgresql://postgres:postgres@db:5432/yemma_candidate
```

## Endpoints API

### Parsing synchrone
```http
POST /api/v1/parse/cv
Content-Type: multipart/form-data

file: <CV file (PDF/DOCX)>
email_override: <optional email>
```

### Parsing asynchrone
```http
POST /api/v1/parse/cv/async
Content-Type: multipart/form-data

file: <CV file (PDF/DOCX)>
email_override: <optional email>
```

### Statut d'un job
```http
GET /api/v1/parse/status/{job_id}
```

### Health check
```http
GET /health
```

## Développement local

```bash
# Installation
pip install -r requirements.txt

# Lancer le service
uvicorn app.main:app --reload --port 8000

# Lancer Celery worker (pour async)
celery -A app.tasks.celery_app worker --loglevel=info
```

## Docker

```bash
# Build
docker build -t yemma-parsing-service .

# Run
docker run -p 8000:8000 \
  -e HRFLOW_API_KEY=xxx \
  -e HRFLOW_SOURCE_KEY=xxx \
  yemma-parsing-service
```

## Structure du projet

```
yemma-parsing-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # Point d'entrée FastAPI
│   ├── core/
│   │   └── config.py        # Configuration
│   ├── api/
│   │   └── v1/
│   │       └── parsing.py   # Endpoints API
│   ├── models/
│   │   └── schemas.py       # Schemas Pydantic (format Yemma)
│   ├── services/
│   │   ├── hrflow_client.py # Client HRFlow.ai
│   │   └── mapping.py       # Mapper HRFlow -> Yemma
│   └── tasks/
│       ├── celery_app.py    # Config Celery
│       └── parse_cv.py      # Tâches async
├── requirements.txt
├── Dockerfile
└── README.md
```

## Format de réponse (Yemma)

```json
{
  "profile": {
    "first_name": "Jean",
    "last_name": "Dupont",
    "email": "jean.dupont@email.com",
    "phone": "+33612345678",
    "profile_title": "Développeur Full Stack",
    "professional_summary": "10 ans d'expérience..."
  },
  "experiences": [
    {
      "company_name": "Google",
      "position": "Software Engineer",
      "start_date": "2020-01-15T00:00:00",
      "end_date": null,
      "is_current": true,
      "description": "..."
    }
  ],
  "educations": [
    {
      "diploma": "Master Informatique",
      "institution": "Université Paris-Saclay",
      "graduation_year": 2020,
      "level": "Bac+5"
    }
  ],
  "skills": [
    {
      "name": "Python",
      "skill_type": "TECHNICAL",
      "level": "ADVANCED"
    }
  ]
}
```
