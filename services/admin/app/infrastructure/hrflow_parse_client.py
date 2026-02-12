"""
Client pour parser un CV via HrFlow.ai et obtenir la clé du profil indexé.
Utilisé pour activer l'analyse IA (CvGPT) sur les profils existants.
"""
import logging
from typing import Optional, Tuple

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def parse_cv_and_get_key(file_content: bytes, filename: str) -> Optional[str]:
    """
    Envoie un fichier CV à HrFlow pour parsing et indexation.
    Retourne la clé du profil (hrflow_profile_key) pour Profile Asking.

    Args:
        file_content: Contenu binaire du fichier
        filename: Nom du fichier (ex: cv.pdf)

    Returns:
        Clé du profil HrFlow ou None si erreur
    """
    if not settings.HRFLOW_API_KEY or not settings.HRFLOW_SOURCE_KEY:
        logger.warning("HRFLOW_API_KEY ou HRFLOW_SOURCE_KEY non configurés")
        return None

    url = f"{settings.HRFLOW_API_URL.rstrip('/')}/profile/parsing/file"
    headers = {"X-API-KEY": settings.HRFLOW_API_KEY}
    if settings.HRFLOW_USER_EMAIL:
        headers["X-USER-EMAIL"] = settings.HRFLOW_USER_EMAIL

    files = {"file": (filename, file_content)}
    data = {
        "source_key": settings.HRFLOW_SOURCE_KEY,
        "sync_parsing": "1",
        "sync_parsing_indexing": "1",
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, data=data, files=files)
            response.raise_for_status()
            body = response.json()
    except httpx.HTTPStatusError as e:
        logger.error("HrFlow parse error: %s %s", e.response.status_code, e.response.text)
        raise
    except Exception as e:
        logger.exception("HrFlow parse request failed: %s", e)
        raise

    data_obj = body.get("data") or body
    profile = data_obj.get("profile") if isinstance(data_obj, dict) else None
    if not profile:
        logger.warning("HrFlow response has no data.profile")
        return None

    profile_key = profile.get("key")
    if profile_key:
        logger.info("HrFlow: profil indexé avec clé %s", profile_key[:20] + "..." if len(profile_key) > 20 else profile_key)
    return profile_key
