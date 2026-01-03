# Candidate Service

Service de gestion des profils candidats.

## Structure

```
services/candidate/
├── app/
│   ├── main.py          # Point d'entrée FastAPI
│   └── core/
│       └── config.py    # Configuration
├── Dockerfile
├── requirements.txt
└── README.md
```

## Développement

```bash
# Installer les dépendances
pip install -r requirements.txt

# Démarrer le service
uvicorn app.main:app --reload --port 8002
```

## Docker

```bash
# Build et démarrage
docker-compose up candidate
```

