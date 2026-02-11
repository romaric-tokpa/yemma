"""
Client pour l'API HrFlow.ai Profile Asking (CvGPT).
Permet d'interroger un profil candidat indexé en langage naturel.
Documentation: https://developers.hrflow.ai/reference/ask-a-question-to-a-profile-indexed-in-a-source
"""
import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class HrFlowAskingError(Exception):
    """Erreur lors de l'appel à l'API Profile Asking."""

    pass


async def ask_profile(profile_key: str, question: str) -> str:
    """
    Pose une question en langage naturel sur un profil indexé HrFlow.

    Args:
        profile_key: Clé du profil dans la source HrFlow (hrflow_profile_key).
        question: Question en langage naturel (ex: "Quels sont les points forts de ce candidat ?").

    Returns:
        Réponse générée par l'IA (CvGPT).

    Raises:
        HrFlowAskingError: Si l'API key n'est pas configurée ou si l'appel échoue.
    """
    if not settings.HRFLOW_API_KEY or not settings.HRFLOW_SOURCE_KEY:
        logger.warning("HRFLOW_API_KEY ou HRFLOW_SOURCE_KEY non configurés")
        raise HrFlowAskingError("Profile Asking (CvGPT) n'est pas configuré. Vérifiez HRFLOW_API_KEY et HRFLOW_SOURCE_KEY.")

    url = f"{settings.HRFLOW_API_URL.rstrip('/')}/profile/asking"
    headers = {
        "X-API-KEY": settings.HRFLOW_API_KEY,
        "Content-Type": "application/json",
    }
    if settings.HRFLOW_USER_EMAIL:
        headers["X-USER-EMAIL"] = settings.HRFLOW_USER_EMAIL

    params = {
        "source_key": settings.HRFLOW_SOURCE_KEY,
        "key": profile_key,
        "question": question,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as e:
        logger.error("HrFlow Profile Asking error: %s %s", e.response.status_code, e.response.text)
        raise HrFlowAskingError(
            f"Erreur HrFlow Profile Asking: {e.response.status_code}. "
            "Vérifiez que l'API Asking est activée et que le profil est indexé."
        ) from e
    except httpx.RequestError as e:
        logger.exception("HrFlow Profile Asking request error: %s", e)
        raise HrFlowAskingError(f"Erreur réseau lors de l'appel à CvGPT: {e}") from e

    # Réponse typique: { "code": 200, "data": { "answer": "..." } } ou structure similaire
    if isinstance(data, dict):
        answer = data.get("data", {}).get("answer") if isinstance(data.get("data"), dict) else data.get("answer")
        if answer is not None:
            return str(answer).strip()
        if "message" in data:
            return str(data["message"]).strip()
        logger.warning("HrFlow response structure inattendue: %s", list(data.keys()))
    raise HrFlowAskingError("Réponse HrFlow invalide: champ 'answer' absent.")
