# Service de Notification Asynchrone

Service de notification asynchrone utilisant BackgroundTasks FastAPI et intégrant SendGrid/Mailjet pour l'envoi d'emails.

## Architecture

- **BackgroundTasks FastAPI** : Tâches asynchrones pour l'envoi d'emails
- **SendGrid/Mailjet** : Fournisseurs d'emails (configurables)
- **Templates HTML** : Templates d'emails professionnels

## Templates d'emails implémentés

### 1. Bienvenue (Candidat)
- **Type** : `welcome_candidate`
- **Destinataire** : Candidat qui vient de s'inscrire
- **Contenu** : Message de bienvenue avec guide d'utilisation

### 2. Profil Validé (Candidat)
- **Type** : `profile_validated`
- **Destinataire** : Candidat dont le profil a été validé
- **Contenu** : Confirmation de validation avec lien vers le profil

### 3. Profil Refusé (Candidat)
- **Type** : `profile_rejected`
- **Destinataire** : Candidat dont le profil a été refusé
- **Contenu** : Raison du refus et conseils pour améliorer le profil

### 4. Nouvelle invitation d'équipe (Recruteur)
- **Type** : `recruiter_invitation`
- **Destinataire** : Recruteur invité à rejoindre une entreprise
- **Contenu** : Lien d'invitation avec informations sur l'entreprise

### 5. Alerte de quota d'abonnement atteint (Entreprise)
- **Type** : `quota_alert`
- **Destinataire** : Administrateur d'entreprise
- **Contenu** : Alerte avec pourcentage de quota utilisé et lien pour upgrade

## Endpoints

### POST /api/v1/notifications/send

Envoie une notification de manière asynchrone.

**Body:**
```json
{
  "notification_type": "welcome_candidate",
  "recipient_email": "candidat@example.com",
  "recipient_name": "John Doe",
  "template_data": {
    "candidate_name": "John Doe",
    "profile_url": "https://..."
  }
}
```

**Réponse:** 202 Accepted (traitement en arrière-plan)

### Endpoints spécifiques

#### POST /api/v1/notifications/send/welcome-candidate
```json
{
  "recipient_email": "candidat@example.com",
  "recipient_name": "John Doe",
  "template_data": {
    "candidate_name": "John Doe",
    "profile_url": "https://..."
  }
}
```

#### POST /api/v1/notifications/send/profile-validated
```json
{
  "recipient_email": "candidat@example.com",
  "recipient_name": "John Doe",
  "template_data": {
    "candidate_name": "John Doe",
    "profile_url": "https://..."
  }
}
```

#### POST /api/v1/notifications/send/profile-rejected
```json
{
  "recipient_email": "candidat@example.com",
  "recipient_name": "John Doe",
  "template_data": {
    "candidate_name": "John Doe",
    "rejection_reason": "Profil incomplet",
    "profile_url": "https://..."
  }
}
```

#### POST /api/v1/notifications/send/recruiter-invitation
```json
{
  "recipient_email": "recruteur@example.com",
  "recipient_name": "Jane Smith",
  "template_data": {
    "company_name": "Acme Corp",
    "invitation_token": "abc123",
    "invitation_url": "https://..."
  }
}
```

#### POST /api/v1/notifications/send/quota-alert
```json
{
  "recipient_email": "admin@example.com",
  "recipient_name": "Admin",
  "template_data": {
    "company_name": "Acme Corp",
    "quota_used": 90,
    "quota_limit": 100,
    "quota_type": "profile_views",
    "upgrade_url": "https://..."
  }
}
```

## Configuration

### Variables d'environnement

```env
# Email Provider (smtp, sendgrid, mailjet)
EMAIL_PROVIDER=sendgrid

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yemma.com
SENDGRID_FROM_NAME=Yemma Solutions

# Mailjet (alternative)
MAILJET_API_KEY=xxx
MAILJET_API_SECRET=xxx
MAILJET_FROM_EMAIL=noreply@yemma.com
MAILJET_FROM_NAME=Yemma Solutions

# SMTP (alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=noreply@yemma.com
SMTP_FROM_NAME=Yemma Solutions

# Frontend URL (pour les liens dans les emails)
FRONTEND_URL=http://localhost:3000
```

## Utilisation

### Exemple : Envoyer un email de bienvenue

```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8007/api/v1/notifications/send/welcome-candidate",
        json={
            "recipient_email": "candidat@example.com",
            "recipient_name": "John Doe",
            "template_data": {
                "candidate_name": "John Doe",
                "profile_url": "http://localhost:3000/profile"
            }
        }
    )
    # Réponse immédiate (202 Accepted)
    # L'email est envoyé en arrière-plan
```

### Exemple : Envoyer une alerte de quota

```python
response = await client.post(
    "http://localhost:8007/api/v1/notifications/send/quota-alert",
    json={
        "recipient_email": "admin@example.com",
        "recipient_name": "Admin",
        "template_data": {
            "company_name": "Acme Corp",
            "quota_used": 90,
            "quota_limit": 100,
            "quota_type": "profile_views",
            "upgrade_url": "http://localhost:3000/company/management?tab=subscription"
        }
    }
)
```

## BackgroundTasks FastAPI

Le service utilise **BackgroundTasks** de FastAPI pour l'envoi asynchrone :

- ✅ **Non-bloquant** : La réponse est retournée immédiatement
- ✅ **Simple** : Pas besoin de broker externe (RabbitMQ, Redis)
- ✅ **Intégré** : Natif à FastAPI
- ✅ **Fiable** : Gestion automatique des erreurs

### Avantages vs Celery

- **Plus simple** : Pas de configuration de broker
- **Moins de dépendances** : Pas besoin de Redis/RabbitMQ
- **Idéal pour développement** : Configuration minimale
- **Production** : Peut être migré vers Celery si besoin de plus de scalabilité

## Intégration SendGrid

Le service supporte SendGrid via l'API REST :

1. Créer un compte SendGrid
2. Générer une API Key
3. Configurer `SENDGRID_API_KEY` dans les variables d'environnement
4. Vérifier le domaine d'envoi dans SendGrid Dashboard

## Intégration Mailjet

Le service supporte également Mailjet (à implémenter si nécessaire) :

1. Créer un compte Mailjet
2. Générer API Key et Secret
3. Configurer `MAILJET_API_KEY` et `MAILJET_API_SECRET`

## Statuts de notification

- **PENDING** : Notification créée, en attente d'envoi
- **SENT** : Email envoyé avec succès
- **FAILED** : Échec de l'envoi

## Logs

Les erreurs et succès sont loggés :
- Succès : `Notification {type} sent successfully to {email}`
- Erreur : `Error sending notification {type} to {email}: {error}`

## Migration vers Celery (optionnel)

Pour une production à grande échelle, vous pouvez migrer vers Celery :

1. Installer Celery et un broker (Redis/RabbitMQ)
2. Créer des tâches Celery dans `app/infrastructure/celery_tasks.py`
3. Remplacer `BackgroundTasks` par des appels à Celery
4. Lancer un worker Celery : `celery -A app.infrastructure.celery_tasks worker`

