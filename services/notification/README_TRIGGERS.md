# Service de Notification - Triggers Internes

## Vue d'ensemble

Le Service de Notification expose des endpoints internes (triggers) pour être appelés par les autres services de la plateforme Yemma. Ces triggers utilisent **FastAPI BackgroundTasks** pour envoyer des emails de manière asynchrone.

## Configuration

### Provider d'Email

Le service supporte plusieurs providers :
- **`mock`** (par défaut) : Simule l'envoi d'emails (log uniquement, utile pour le développement)
- **`fastapi_mail`** : Utilise FastAPI-Mail pour l'envoi via SMTP
- **`smtp`** : Envoi direct via SMTP
- **`sendgrid`** : Utilise l'API SendGrid
- **`mailgun`** : Utilise l'API Mailgun

Configuration via variable d'environnement :
```bash
EMAIL_PROVIDER=mock  # ou fastapi_mail, smtp, sendgrid, mailgun
```

### FastAPI-Mail

Pour utiliser FastAPI-Mail, configurez les variables SMTP :
```bash
EMAIL_PROVIDER=fastapi_mail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=noreply@yemma.com
SMTP_FROM_NAME=Yemma Solutions
```

## Endpoints Internes (Triggers)

Tous les endpoints sont protégés par un token interne (`X-Service-Token`).

### 1. `POST /api/v1/triggers/notify_validation`

Envoie un email de félicitations au candidat quand son profil est VALIDATED.

**Appelé par :** Admin Service après validation d'un profil

**Body :**
```json
{
  "candidate_email": "candidat@example.com",
  "candidate_name": "Jean Dupont",
  "profile_url": "https://yemma.com/candidate/profile"
}
```

**Réponse :**
```json
{
  "message": "Validation notification queued",
  "notification_id": 123,
  "status": "pending"
}
```

**Exemple d'appel :**
```python
import httpx
from services.shared.internal_auth import get_service_token_header

headers = get_service_token_header("admin-service")
response = await httpx.post(
    "http://notification-service:8007/api/v1/triggers/notify_validation",
    json={
        "candidate_email": "candidat@example.com",
        "candidate_name": "Jean Dupont",
        "profile_url": "https://yemma.com/candidate/profile"
    },
    headers=headers
)
```

### 2. `POST /api/v1/triggers/notify_rejection`

Envoie un email au candidat avec le motif du refus quand le statut est REJECTED.

**Appelé par :** Admin Service après rejet d'un profil

**Body :**
```json
{
  "candidate_email": "candidat@example.com",
  "candidate_name": "Jean Dupont",
  "rejection_reason": "Profil ne correspond pas aux critères requis",
  "profile_url": "https://yemma.com/candidate/profile"
}
```

**Réponse :**
```json
{
  "message": "Rejection notification queued",
  "notification_id": 124,
  "status": "pending"
}
```

### 3. `POST /api/v1/triggers/notify_invitation`

Envoie un email avec un lien magique (token) lorsqu'un Admin d'Entreprise invite un nouveau recruteur.

**Appelé par :** Company Service lors de l'invitation d'un recruteur

**Body :**
```json
{
  "recipient_email": "recruteur@example.com",
  "recipient_name": "Marie Martin",
  "company_name": "Acme Corp",
  "invitation_token": "abc123xyz789",
  "invitation_url": "https://yemma.com/invitation/accept?token=abc123xyz789"
}
```

**Réponse :**
```json
{
  "message": "Invitation notification queued",
  "notification_id": 125,
  "status": "pending"
}
```

## Templates HTML

Les templates sont simples, professionnels et responsive. Ils utilisent un design moderne avec :

- **Header** : Dégradé bleu-violet avec titre
- **Content** : Contenu principal avec texte clair et structuré
- **CTA Button** : Bouton d'action avec dégradé
- **Footer** : Informations légales et copyright

### Templates disponibles

1. **Profile Validated** : Email de félicitations avec lien vers le profil
2. **Profile Rejected** : Email avec motif de rejet et conseils d'amélioration
3. **Recruiter Invitation** : Email d'invitation avec lien magique

## Utilisation en développement

Avec `EMAIL_PROVIDER=mock`, les emails sont :
- Loggés dans la console avec tous les détails
- Sauvegardés dans `/tmp/yemma_emails/` (fichiers HTML)

## Exemple d'intégration dans Admin Service

```python
# services/admin/app/infrastructure/notification_client.py
import httpx
from services.shared.internal_auth import get_service_token_header
from app.core.config import settings

async def notify_validation(
    candidate_email: str,
    candidate_name: str,
    profile_url: str = None
) -> bool:
    """Notifie la validation d'un profil"""
    try:
        headers = get_service_token_header("admin-service")
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/triggers/notify_validation",
                json={
                    "candidate_email": candidate_email,
                    "candidate_name": candidate_name,
                    "profile_url": profile_url or f"{settings.FRONTEND_URL}/candidate/profile"
                },
                headers=headers
            )
            response.raise_for_status()
            return True
    except httpx.HTTPError as e:
        print(f"⚠️ Erreur lors de l'envoi de la notification: {str(e)}")
        return False
```

## Sécurité

- Tous les endpoints de triggers sont protégés par `verify_internal_token`
- Seuls les services internes avec un token valide peuvent appeler ces endpoints
- Le token est généré via `services/shared/internal_auth.py`

## Tests

Pour tester avec le provider mock :
```bash
EMAIL_PROVIDER=mock python -m uvicorn app.main:app --reload
```

Les emails seront loggés dans la console et sauvegardés dans `/tmp/yemma_emails/`.

