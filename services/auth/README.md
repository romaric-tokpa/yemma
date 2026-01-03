# Auth Service

Service d'authentification et de gestion des utilisateurs.

## Structure

```
services/auth/
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
uvicorn app.main:app --reload --port 8001
```

## Docker

```bash
# Build et démarrage
docker-compose up auth
```

