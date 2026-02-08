"""
Client pour appeler le Service Notification (triggers)
Utilisé après inscription candidat pour envoyer l'email "compte créé + onboarding".
"""
import logging
import os
import sys

# Résolution du module shared (internal_auth pour le token inter-services)
# Cas 1: volume /shared (contenu = contenu du dossier shared) -> /shared/internal_auth.py, sys.path = ["/"]
# Cas 2: Dockerfile COPY shared /app/shared -> /app/shared/internal_auth.py, sys.path = ["/app"]
# Cas 3: chemin relatif depuis auth-service -> services/shared/internal_auth.py, sys.path = [project_root]
get_service_token_header = None

_candidates = [
    ("/shared/internal_auth.py", "/"),           # docker-compose dev mount ./services/shared:/shared
    ("/app/shared/internal_auth.py", "/app"),    # Dockerfile COPY shared /app/shared
]
# Chemin relatif: depuis .../auth-service/app/infrastructure/ -> ../../../shared/internal_auth.py
_rel = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "shared", "internal_auth.py"))
if os.path.exists(_rel):
    _candidates.append((_rel, os.path.dirname(os.path.dirname(_rel))))  # parent de "shared"

for _path, _parent in _candidates:
    if not os.path.exists(_path):
        continue
    if _parent and _parent not in sys.path:
        sys.path.insert(0, _parent)
    try:
        from shared.internal_auth import get_service_token_header
        break
    except ImportError:
        continue

import httpx
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_candidate_registration_notification(
    candidate_email: str,
    candidate_name: str,
    onboarding_url: Optional[str] = None,
) -> None:
    """
    Envoie un email au candidat après création de son compte (inscription),
    pour l'informer que son compte est créé et qu'il doit suivre le processus d'onboarding.

    Appelé par le Auth Service après register avec rôle ROLE_CANDIDAT.
    Ne bloque pas l'inscription si l'envoi échoue.

    Args:
        candidate_email: Email du candidat
        candidate_name: Nom du candidat (ex. prénom + nom ou email)
        onboarding_url: URL de la page d'onboarding (optionnel)
    """
    if get_service_token_header is None:
        logger.error(
            "Notification client: get_service_token_header non disponible (module shared introuvable). "
            "Email inscription candidat non envoyé. Vérifiez que le volume /shared est monté ou que shared est dans le PYTHONPATH."
        )
        return

    try:
        headers = get_service_token_header("auth-service")
        if not onboarding_url:
            onboarding_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/onboarding"

        payload = {
            "candidate_email": candidate_email,
            "candidate_name": candidate_name or candidate_email.split("@")[0],
            "onboarding_url": onboarding_url,
        }

        logger.info(f"Sending candidate registration notification to {candidate_email}")

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/triggers/notify_candidate_registration",
                json=payload,
                headers=headers,
            )

            if response.status_code != 202:
                logger.warning(
                    f"Notification service returned {response.status_code}: {response.text}"
                )

            response.raise_for_status()
            logger.info(f"Candidate registration email queued for {candidate_email}")

    except Exception as e:
        # Ne pas bloquer l'inscription si l'email échoue
        logger.error(
            f"Failed to send candidate registration email to {candidate_email}: {e}",
            exc_info=True,
        )


async def send_company_registration_notification(
    recipient_email: str,
    recipient_name: str,
    onboarding_url: Optional[str] = None,
) -> None:
    """
    Envoie un email au recruteur après création de son compte (inscription /register/company),
    pour l'informer que son compte est créé et qu'il peut compléter l'onboarding entreprise.

    Appelé par le Auth Service après register avec rôle ROLE_COMPANY_ADMIN.
    Ne bloque pas l'inscription si l'envoi échoue.
    """
    if get_service_token_header is None:
        logger.error(
            "Notification client: get_service_token_header non disponible. "
            "Email inscription recruteur non envoyé."
        )
        return

    try:
        headers = get_service_token_header("auth-service")
        if not onboarding_url:
            onboarding_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/company/onboarding"

        payload = {
            "recipient_email": recipient_email,
            "recipient_name": recipient_name or recipient_email.split("@")[0],
            "onboarding_url": onboarding_url,
        }

        logger.info("Sending company registration notification to %s", recipient_email)

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/triggers/notify_company_registration",
                json=payload,
                headers=headers,
            )

            if response.status_code != 202:
                logger.warning(
                    "Notification service returned %s: %s",
                    response.status_code,
                    response.text,
                )

            response.raise_for_status()
            logger.info("Company registration email queued for %s", recipient_email)

    except Exception as e:
        logger.error(
            "Failed to send company registration email to %s: %s",
            recipient_email,
            e,
            exc_info=True,
        )
