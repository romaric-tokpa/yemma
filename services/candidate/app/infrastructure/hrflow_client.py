"""
Client pour l'API Hrflow.ai - Parsing de CV
https://developers.hrflow.ai/reference/parse-a-resume
"""
import logging
from typing import Any, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

HRFLOW_PARSE_URL = f"{settings.HRFLOW_API_URL.rstrip('/')}/profile/parsing/file"


async def parse_resume_file(file_content: bytes, filename: str) -> Optional[dict[str, Any]]:
    """
    Envoie un fichier CV à Hrflow pour parsing synchrone et retourne le profil parsé.

    :param file_content: Contenu binaire du fichier
    :param filename: Nom du fichier (ex: cv.pdf)
    :return: Dictionnaire du profil Hrflow (data.profile) ou None si erreur
    """
    if not settings.HRFLOW_API_KEY or not settings.HRFLOW_SOURCE_KEY:
        logger.warning("HRFLOW_API_KEY ou HRFLOW_SOURCE_KEY non configurés")
        return None

    headers = {
        "X-API-KEY": settings.HRFLOW_API_KEY,
    }
    if settings.HRFLOW_USER_EMAIL:
        headers["X-USER-EMAIL"] = settings.HRFLOW_USER_EMAIL

    # multipart: file + source_key + sync_parsing + indexation (pour Profile Asking / CvGPT)
    files = {"file": (filename, file_content)}
    data = {
        "source_key": settings.HRFLOW_SOURCE_KEY,
        "sync_parsing": "1",
        "sync_parsing_indexing": "1",  # Indexe le profil pour l'API Profile Asking
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                HRFLOW_PARSE_URL,
                headers=headers,
                data=data,
                files=files,
            )
            response.raise_for_status()
            body = response.json()
    except httpx.HTTPStatusError as e:
        logger.error("Hrflow API error: %s %s", e.response.status_code, e.response.text)
        raise
    except Exception as e:
        logger.exception("Hrflow request failed: %s", e)
        raise

    # Réponse typique: { "code": 200, "message": "...", "data": { "profile": { ... } } }
    data_obj = body.get("data") or body
    profile = data_obj.get("profile") if isinstance(data_obj, dict) else None
    if not profile:
        logger.warning("Hrflow response has no data.profile: %s", list(body.keys()))
    return profile
