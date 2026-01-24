# Notification Service

Service de notification asynchrone avec envoi d'emails pour la plateforme Yemma Solutions.

## 🎯 Vue d'ensemble

Le service notification gère l'envoi d'emails asynchrones pour toute la plateforme, avec support de plusieurs providers (SMTP, SendGrid, Mailgun) et templates HTML professionnels.

## ✨ Fonctionnalités

- ✅ Envoi d'emails asynchrone via BackgroundTasks
- ✅ Support de plusieurs providers : SMTP, SendGrid, Mailgun
- ✅ Templates d'emails HTML professionnels
- ✅ 3 modèles d'emails pré-configurés :
  - Profil validé
  - Action requise sur votre profil
  - Nouvelle invitation recruteur
  - Bienvenue entreprise
- ✅ Historique des notifications en base de données
- ✅ Gestion des erreurs et retry automatique
- ✅ Statuts de notification (pending, sent, failed)

## 📁 Structure

```
services/notification/
├── app/
│   ├── main.py                    # FastAPI app
│   ├── api/v1/
│   │   ├── notifications.py      # Endpoints notifications
│   │   ├── triggers.py           # Endpoints triggers (emails pré-configurés)
│   │   └── health.py              # Health check
│   ├── core/
│   │   ├── config.py             # Configuration
│   │   └── exceptions.py         # Gestion des erreurs
│   ├── domain/
│   │   ├── models.py             # Modèle Notification
│   │   └── schemas.py            # Schémas Pydantic
│   └── infrastructure/
│       ├── database.py           # Configuration DB
│       ├── email_templates_simple.py # Templates d'emails
│       ├── email_sender.py       # Service d'envoi
│       └── repositories.py       # Repositories
├── Dockerfile
├── requirements.txt
└── README.md
```

## 📊 Modèle de données

### Notification

Modèle principal représentant une notification :

- `id` : ID unique
- `notification_type` : Type (profile_validated, action_required, recruiter_invitation, company_welcome)
- `recipient_email` : Email du destinataire
- `recipient_name` : Nom du destinataire (optionnel)
- `subject` : Sujet de l'email
- `body_html` : Corps HTML de l'email
- `metadata` : Métadonnées JSON (données spécifiques au type)
- `status` : Statut (pending, sent, failed)
- `error_message` : Message d'erreur si échec
- `sent_at` : Date d'envoi
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

## 🚀 Endpoints

### Créer une notification générique

#### POST /api/v1/notifications

Crée et envoie une notification générique.

**Body :**
```json
{
  "notification_type": "profile_validated",
  "recipient_email": "candidate@example.com",
  "recipient_name": "John Doe",
  "metadata": {
    "candidate_name": "Jane Smith",
    "profile_url": "https://yemma.com/profile/123"
  }
}
```

### Triggers (emails pré-configurés)

#### POST /api/v1/triggers/profile-validated

Envoie une notification "Profil validé".

**Body :**
```json
{
  "recipient_email": "candidate@example.com",
  "recipient_name": "John Doe",
  "candidate_name": "John Doe",
  "profile_url": "https://yemma.com/profile/123"
}
```

#### POST /api/v1/triggers/action-required

Envoie une notification "Action requise".

**Body :**
```json
{
  "recipient_email": "candidate@example.com",
  "recipient_name": "John Doe",
  "candidate_name": "John Doe",
  "action_message": "Veuillez compléter votre CV",
  "profile_url": "https://yemma.com/profile/123"
}
```

#### POST /api/v1/triggers/recruiter-invitation

Envoie une notification "Invitation recruteur".

**Body :**
```json
{
  "recipient_email": "recruiter@example.com",
  "recipient_name": "Jane Recruiter",
  "company_name": "Acme Corp",
  "invitation_token": "abc123xyz",
  "invitation_url": "https://yemma.com/invitation/accept?token=abc123xyz"
}
```

#### POST /api/v1/triggers/company-welcome

Envoie une notification "Bienvenue entreprise".

**Body :**
```json
{
  "recipient_email": "admin@company.com",
  "recipient_name": "Company Admin",
  "company_name": "Acme Corp",
  "dashboard_url": "https://yemma.com/company/dashboard"
}
```

### Récupérer une notification

#### GET /api/v1/notifications/{notification_id}

Récupère les détails d'une notification.

## 📧 Modèles d'emails

### 1. Profil validé

Envoyé lorsqu'un profil candidat est validé par l'admin.

**Contenu :**
- Félicitations pour la validation
- Lien vers le profil
- Informations sur la visibilité dans la CVthèque

### 2. Action requise

Envoyé lorsqu'une action est requise sur le profil du candidat.

**Contenu :**
- Message personnalisé de l'action requise
- Lien vers le profil pour compléter
- Instructions claires

### 3. Invitation recruteur

Envoyé lorsqu'un recruteur est invité à rejoindre une entreprise.

**Contenu :**
- Nom de l'entreprise
- Lien d'invitation avec token
- Instructions pour accepter l'invitation

### 4. Bienvenue entreprise

Envoyé lors de la création d'une entreprise.

**Contenu :**
- Message de bienvenue
- Lien vers le dashboard
- Prochaines étapes

## ⚙️ Configuration

### Variables d'environnement

#### Provider Email

```env
EMAIL_PROVIDER=smtp  # ou sendgrid, mailgun
```

#### SMTP

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=noreply@yemma.com
SMTP_FROM_NAME=Yemma Solutions
```

**Note pour Gmail** : Utiliser un "App Password" au lieu du mot de passe normal.

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

#### Database

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=yemma_notification_db
```

## 🛠️ Développement

### Installation locale

```bash
# Installer les dépendances
pip install -r requirements.txt

# Démarrer le service
uvicorn app.main:app --reload --port 8007
```

### Avec Docker

```bash
# Build et démarrage
docker-compose up notification-service

# Voir les logs
docker-compose logs -f notification-service
```

## 📝 Exemples d'utilisation

### Envoyer une notification "Profil validé"

```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8007/api/v1/triggers/profile-validated",
        json={
            "recipient_email": "candidate@example.com",
            "recipient_name": "John Doe",
            "candidate_name": "John Doe",
            "profile_url": "https://yemma.com/profile/123"
        }
    )
    print(response.json())
```

### Envoyer une notification "Invitation recruteur"

```python
async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8007/api/v1/triggers/recruiter-invitation",
        json={
            "recipient_email": "recruiter@example.com",
            "recipient_name": "Jane Recruiter",
            "company_name": "Acme Corp",
            "invitation_token": "abc123xyz",
            "invitation_url": "https://yemma.com/invitation/accept?token=abc123xyz"
        }
    )
```

## 🔗 Intégration avec les autres services

### Company Service

Lors de l'envoi d'une invitation recruteur :
```python
# Dans company service
await notification_client.post(
    "/api/v1/triggers/recruiter-invitation",
    json={
        "recipient_email": recruiter_email,
        "company_name": company.name,
        "invitation_token": token,
        "invitation_url": f"{FRONTEND_URL}/invitation/accept?token={token}"
    }
)
```

### Admin Service

Lors de la validation d'un profil :
```python
# Dans admin service
await notification_client.post(
    "/api/v1/triggers/profile-validated",
    json={
        "recipient_email": candidate.email,
        "candidate_name": candidate.full_name,
        "profile_url": f"{FRONTEND_URL}/candidates/{candidate_id}"
    }
)
```

### Company Service (bienvenue)

Lors de la création d'une entreprise :
```python
# Dans company service
await notification_client.post(
    "/api/v1/triggers/company-welcome",
    json={
        "recipient_email": admin_email,
        "recipient_name": admin_name,
        "company_name": company.name,
        "dashboard_url": f"{FRONTEND_URL}/company/dashboard"
    }
)
```

## 📊 Statuts des notifications

- **pending** : En attente d'envoi
- **sent** : Envoyée avec succès
- **failed** : Échec d'envoi (avec message d'erreur)

## 🔄 Envoi asynchrone

Les emails sont envoyés de manière asynchrone via `BackgroundTasks` de FastAPI :

- ✅ Non-bloquant : La réponse est retournée immédiatement
- ✅ Performant : Pas d'attente de l'envoi
- ✅ Résilient : Les erreurs sont loggées et le statut est mis à jour

## 🧪 Tests

```bash
# Exécuter les tests
pytest

# Avec couverture
pytest --cov=app
```

## 📚 Documentation supplémentaire

- [Configuration Celery](./README_CELERY.md) (pour envoi asynchrone avancé)
- [Configuration async](./README_ASYNC.md)
- [Triggers disponibles](./README_TRIGGERS.md)

## 🚀 Prochaines étapes

- [ ] Implémenter le retry automatique pour les échecs
- [ ] Ajouter le support de templates personnalisables
- [ ] Implémenter l'envoi de SMS (Twilio)
- [ ] Ajouter les notifications push (web push)
- [ ] Implémenter les préférences de notification par utilisateur
- [ ] Ajouter les statistiques d'envoi (taux d'ouverture, etc.)

---

**Service développé pour Yemma Solutions**
