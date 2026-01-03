# Service de Notification Asynchrone - Documentation Complète

## ✅ Implémentation terminée

Service de notification asynchrone avec **Celery** et **BackgroundTasks FastAPI**, intégrant **SendGrid** pour l'envoi d'emails professionnels.

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

Définir `TASK_QUEUE=celery` pour utiliser Celery, sinon BackgroundTasks est utilisé.

## 📧 Templates d'emails implémentés

### 1. ✅ Bienvenue (Candidat)
- **Type** : `welcome_candidate`
- **Fichier** : `app/infrastructure/email_templates.py`
- **Contenu** : Message de bienvenue avec guide d'utilisation et fonctionnalités

### 2. ✅ Profil Validé (Candidat)
- **Type** : `profile_validated`
- **Contenu** : Confirmation de validation avec lien vers le profil

### 3. ✅ Profil Refusé (Candidat)
- **Type** : `profile_rejected`
- **Contenu** : Raison du refus et conseils pour améliorer le profil

### 4. ✅ Nouvelle invitation d'équipe (Recruteur)
- **Type** : `recruiter_invitation`
- **Contenu** : Lien d'invitation avec informations sur l'entreprise

### 5. ✅ Alerte de quota d'abonnement atteint (Entreprise)
- **Type** : `quota_alert`
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

- `POST /api/v1/notifications/send/welcome-candidate`
- `POST /api/v1/notifications/send/profile-validated`
- `POST /api/v1/notifications/send/profile-rejected`
- `POST /api/v1/notifications/send/recruiter-invitation`
- `POST /api/v1/notifications/send/quota-alert`

## 🚀 Utilisation

### Avec BackgroundTasks (défaut)

```bash
# Lancer le service
docker-compose up notification
```

### Avec Celery

```bash
# Lancer le service et le worker
docker-compose up notification notification-worker
```

## 📦 Intégration SendGrid

Le service utilise le SDK SendGrid officiel si disponible, sinon fait un fallback vers l'API REST.

### Installation

Le SDK est inclus dans `requirements.txt` :
```
sendgrid==6.11.0
```

### Configuration SendGrid

1. Créer un compte SendGrid
2. Générer une API Key (Settings > API Keys)
3. Configurer les variables d'environnement :
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxx
   SENDGRID_FROM_EMAIL=noreply@yemma.com
   SENDGRID_FROM_NAME=Yemma Solutions
   ```

## 🔄 Retry automatique (Celery)

Avec Celery, les tâches échouées sont automatiquement retentées :
- 1er retry : après 60 secondes
- 2ème retry : après 120 secondes
- 3ème retry : après 240 secondes

Maximum 3 tentatives.

## 📊 Statuts des notifications

- `pending` : En attente d'envoi
- `sent` : Envoyée avec succès
- `failed` : Échec d'envoi (avec message d'erreur)

## 🔗 Intégration avec les autres services

### Auth Service - Inscription candidat
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

### Admin Service - Validation/Refus profil
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

### Company Service - Invitation recruteur
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

### Payment Service - Alerte quota
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

## ✅ Fonctionnalités complètes

- ✅ Envoi d'emails asynchrone (BackgroundTasks ou Celery)
- ✅ Intégration SendGrid avec SDK officiel
- ✅ 5 templates d'emails professionnels HTML
- ✅ Retry automatique avec Celery
- ✅ Historique des notifications en base
- ✅ Gestion des erreurs et logging
- ✅ Support SMTP, SendGrid, Mailgun
- ✅ Templates responsive et professionnels

## 📝 Fichiers créés/modifiés

### Nouveaux fichiers
- `app/infrastructure/celery_app.py` - Configuration Celery
- `app/infrastructure/celery_tasks.py` - Tâches Celery
- `celery_worker.py` - Script worker
- `README_CELERY.md` - Documentation Celery

### Fichiers modifiés
- `app/core/config.py` - Ajout configuration Redis et TASK_QUEUE
- `app/api/v1/notifications.py` - Support Celery/BackgroundTasks
- `app/infrastructure/email_sender.py` - Amélioration SendGrid avec SDK
- `requirements.txt` - Ajout Celery, Redis, SendGrid
- `docker-compose.yml` - Ajout notification-worker

## 🎯 Prêt pour production

Le service est maintenant complètement fonctionnel avec :
- ✅ Celery pour la production
- ✅ BackgroundTasks pour le développement
- ✅ SendGrid intégré
- ✅ Tous les templates d'emails
- ✅ Retry automatique
- ✅ Monitoring et logging

