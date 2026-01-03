# Notification Service

Service de notification asynchrone avec envoi d'emails (SMTP, SendGrid, Mailgun).

## Fonctionnalités

- ✅ Envoi d'emails asynchrone via BackgroundTasks
- ✅ Support de plusieurs providers : SMTP, SendGrid, Mailgun
- ✅ Templates d'emails HTML professionnels
- ✅ 3 modèles d'emails pré-configurés :
  - Profil validé
  - Action requise sur votre profil
  - Nouvelle invitation recruteur
- ✅ Historique des notifications en base de données
- ✅ Gestion des erreurs et retry automatique

## Architecture

```
services/notification/
├── app/
│   ├── main.py                    # FastAPI app
│   ├── api/v1/
│   │   ├── notifications.py      # Endpoints notifications
│   │   └── health.py              # Health check
│   ├── core/
│   │   ├── config.py             # Configuration
│   │   └── exceptions.py         # Gestion des erreurs
│   ├── domain/
│   │   ├── models.py             # Modèle Notification
│   │   └── schemas.py            # Schémas Pydantic
│   └── infrastructure/
│       ├── database.py           # Configuration DB
│       ├── email_templates.py   # Templates d'emails
│       ├── email_sender.py      # Service d'envoi
│       └── repositories.py      # Repositories
├── Dockerfile
├── requirements.txt
└── README.md
```

## Modèles d'emails

### 1. Profil validé
Envoyé lorsqu'un profil candidat est validé par l'admin.

**Données requises :**
- `recipient_email` : Email du candidat
- `recipient_name` : Nom du candidat (optionnel)
- `candidate_name` : Nom du profil
- `profile_url` : URL du profil (optionnel)

### 2. Action requise
Envoyé lorsqu'une action est requise sur le profil du candidat.

**Données requises :**
- `recipient_email` : Email du candidat
- `recipient_name` : Nom du candidat (optionnel)
- `candidate_name` : Nom du profil
- `action_message` : Message décrivant l'action requise
- `profile_url` : URL du profil (optionnel)

### 3. Invitation recruteur
Envoyé lorsqu'un recruteur est invité à rejoindre une entreprise.

**Données requises :**
- `recipient_email` : Email du recruteur
- `recipient_name` : Nom du recruteur (optionnel)
- `company_name` : Nom de l'entreprise
- `invitation_token` : Token d'invitation
- `invitation_url` : URL d'invitation (optionnel)

## Endpoints

### Créer une notification générique
```http
POST /api/v1/notifications
Content-Type: application/json

{
  "notification_type": "profile_validated",
  "recipient_email": "candidate@example.com",
  "recipient_name": "John Doe",
  "metadata": {
    "candidate_name": "Jane Smith",
    "profile_url": "https://..."
  }
}
```

### Envoyer une notification "Profil validé"
```http
POST /api/v1/notifications/profile-validated
Content-Type: application/json

{
  "recipient_email": "candidate@example.com",
  "recipient_name": "John Doe",
  "candidate_name": "Jane Smith",
  "profile_url": "https://yemma.com/profile/123"
}
```

### Envoyer une notification "Action requise"
```http
POST /api/v1/notifications/action-required
Content-Type: application/json

{
  "recipient_email": "candidate@example.com",
  "recipient_name": "John Doe",
  "candidate_name": "Jane Smith",
  "action_message": "Veuillez compléter votre CV",
  "profile_url": "https://yemma.com/profile/123"
}
```

### Envoyer une notification "Invitation recruteur"
```http
POST /api/v1/notifications/recruiter-invitation
Content-Type: application/json

{
  "recipient_email": "recruiter@example.com",
  "recipient_name": "Jane Recruiter",
  "company_name": "Acme Corp",
  "invitation_token": "abc123xyz",
  "invitation_url": "https://yemma.com/invitation/accept?token=abc123xyz"
}
```

### Récupérer une notification
```http
GET /api/v1/notifications/{notification_id}
```

## Configuration

### Variables d'environnement

#### Provider Email
```env
EMAIL_PROVIDER=smtp  # ou sendgrid, mailgun
```

#### SMTP
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=noreply@yemma.com
SMTP_FROM_NAME=Yemma Solutions
```

#### SendGrid
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yemma.com
SENDGRID_FROM_NAME=Yemma Solutions
```

#### Mailgun
```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=mg.yemma.com
MAILGUN_FROM_EMAIL=noreply@yemma.com
MAILGUN_FROM_NAME=Yemma Solutions
```

#### Frontend
```env
FRONTEND_URL=http://localhost:3000
```

## Utilisation

### Exemple : Envoyer une notification "Profil validé"

```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8007/api/v1/notifications/profile-validated",
        json={
            "recipient_email": "candidate@example.com",
            "recipient_name": "John Doe",
            "candidate_name": "Jane Smith",
            "profile_url": "https://yemma.com/profile/123"
        }
    )
    print(response.json())
```

## Intégration avec les autres services

### Company Service
Lors de l'envoi d'une invitation recruteur :
```python
# Dans company service
await notification_client.post(
    "/api/v1/notifications/recruiter-invitation",
    json={
        "recipient_email": recruiter_email,
        "company_name": company.name,
        "invitation_token": token,
    }
)
```

### Admin Service
Lors de la validation d'un profil :
```python
# Dans admin service
await notification_client.post(
    "/api/v1/notifications/profile-validated",
    json={
        "recipient_email": candidate.email,
        "candidate_name": candidate.name,
    }
)
```

## Statuts des notifications

- `pending` : En attente d'envoi
- `sent` : Envoyée avec succès
- `failed` : Échec d'envoi (avec message d'erreur)

## Notes

- Les emails sont envoyés de manière asynchrone via `BackgroundTasks`
- Les templates HTML sont inclus dans le code (facilement personnalisables)
- Le service enregistre toutes les notifications en base pour traçabilité
- En cas d'échec, le statut est mis à jour avec le message d'erreur


