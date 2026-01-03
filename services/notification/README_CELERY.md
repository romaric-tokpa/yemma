# Service de Notification Asynchrone avec Celery

## ✅ Implémentation complète

Service de notification asynchrone utilisant **Celery** ou **BackgroundTasks FastAPI** avec intégration **SendGrid** pour l'envoi d'emails.

## 🏗️ Architecture

### Options de tâches asynchrones

1. **BackgroundTasks FastAPI** (par défaut)
   - Simple et intégré
   - Pas de dépendances supplémentaires
   - Idéal pour le développement

2. **Celery** (production)
   - Plus robuste et scalable
   - Retry automatique avec exponential backoff
   - Monitoring et gestion des queues
   - Idéal pour la production

### Configuration

Définir la variable d'environnement `TASK_QUEUE` :
- `background_tasks` : Utilise BackgroundTasks FastAPI
- `celery` : Utilise Celery avec Redis

## 📧 Templates d'emails implémentés

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

## 🔧 Configuration

### Variables d'environnement

```env
# Task Queue
TASK_QUEUE=celery  # ou background_tasks

# Redis (pour Celery)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Email Provider
EMAIL_PROVIDER=sendgrid  # ou smtp, mailgun

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yemma.com
SENDGRID_FROM_NAME=Yemma Solutions

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 📡 Endpoints API

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
    "profile_url": "https://yemma.com/profile"
  }
}
```

### Endpoints spécifiques

#### POST /api/v1/notifications/send/welcome-candidate
#### POST /api/v1/notifications/send/profile-validated
#### POST /api/v1/notifications/send/profile-rejected
#### POST /api/v1/notifications/send/recruiter-invitation
#### POST /api/v1/notifications/send/quota-alert

## 🚀 Utilisation avec Celery

### Lancer le worker Celery

```bash
# Local
celery -A celery_worker.celery_app worker --loglevel=info --queues=notifications

# Docker
docker-compose up notification-worker
```

### Monitoring Celery

```bash
# Flower (optionnel)
celery -A celery_worker.celery_app flower
```

## 📦 Intégration SendGrid

Le service utilise le SDK SendGrid officiel si disponible, sinon fait un fallback vers l'API REST.

### Installation du SDK

```bash
pip install sendgrid
```

### Configuration

1. Créer un compte SendGrid
2. Générer une API Key
3. Configurer les variables d'environnement

## 🔄 Retry automatique

Avec Celery, les tâches échouées sont automatiquement retentées avec exponential backoff :
- 1er retry : après 60 secondes
- 2ème retry : après 120 secondes
- 3ème retry : après 240 secondes

## 📊 Statuts des notifications

- `pending` : En attente d'envoi
- `sent` : Envoyée avec succès
- `failed` : Échec d'envoi (avec message d'erreur)

## 🔗 Intégration avec les autres services

### Auth Service
Lors de l'inscription d'un candidat :
```python
await notification_client.post(
    "/api/v1/notifications/send/welcome-candidate",
    json={
        "recipient_email": candidate.email,
        "recipient_name": candidate.name,
        "template_data": {
            "candidate_name": candidate.name,
            "profile_url": f"{FRONTEND_URL}/onboarding"
        }
    }
)
```

### Admin Service
Lors de la validation/refus d'un profil :
```python
# Validation
await notification_client.post(
    "/api/v1/notifications/send/profile-validated",
    json={
        "recipient_email": candidate.email,
        "recipient_name": candidate.name,
        "template_data": {
            "candidate_name": candidate.name,
            "profile_url": f"{FRONTEND_URL}/candidate/dashboard"
        }
    }
)

# Refus
await notification_client.post(
    "/api/v1/notifications/send/profile-rejected",
    json={
        "recipient_email": candidate.email,
        "recipient_name": candidate.name,
        "template_data": {
            "candidate_name": candidate.name,
            "rejection_reason": "Profil incomplet",
            "profile_url": f"{FRONTEND_URL}/onboarding"
        }
    }
)
```

### Company Service
Lors de l'invitation d'un recruteur :
```python
await notification_client.post(
    "/api/v1/notifications/send/recruiter-invitation",
    json={
        "recipient_email": recruiter_email,
        "recipient_name": recruiter_name,
        "template_data": {
            "company_name": company.name,
            "invitation_token": token,
            "invitation_url": f"{FRONTEND_URL}/invitation/accept?token={token}"
        }
    }
)
```

### Payment Service
Lors de l'atteinte d'un quota :
```python
await notification_client.post(
    "/api/v1/notifications/send/quota-alert",
    json={
        "recipient_email": company_admin.email,
        "recipient_name": company_admin.name,
        "template_data": {
            "company_name": company.name,
            "quota_used": 90,
            "quota_limit": 100,
            "quota_type": "profile_views",
            "upgrade_url": f"{FRONTEND_URL}/company/management?tab=subscription"
        }
    }
)
```

## 🐳 Docker Compose

Le service inclut :
- `notification` : Service FastAPI principal
- `notification-worker` : Worker Celery (si TASK_QUEUE=celery)

## ✅ Fonctionnalités

- ✅ Envoi d'emails asynchrone (BackgroundTasks ou Celery)
- ✅ Intégration SendGrid avec SDK officiel
- ✅ 5 templates d'emails professionnels
- ✅ Retry automatique avec Celery
- ✅ Historique des notifications en base
- ✅ Gestion des erreurs et logging
- ✅ Support SMTP, SendGrid, Mailgun

