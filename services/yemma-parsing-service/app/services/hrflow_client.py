"""
Client HRFlow.ai pour le parsing de CV
Documentation: https://developers.hrflow.ai/
"""
import logging
from typing import Optional, Dict, Any
import requests
from requests.exceptions import RequestException

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class HRFlowClient:
    """Client pour l'API HRFlow.ai"""

    def __init__(self):
        self.settings = get_settings()
        self.api_url = self.settings.HRFLOW_API_URL
        self.api_key = self.settings.HRFLOW_API_KEY
        self.source_key = self.settings.HRFLOW_SOURCE_KEY
        self.timeout = self.settings.HRFLOW_TIMEOUT

    @property
    def headers(self) -> Dict[str, str]:
        """Headers pour les requêtes HRFlow"""
        return {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json",
        }

    def parse_cv(self, file_content: bytes, filename: str, content_type: str = "application/pdf") -> Dict[str, Any]:
        """
        Parse un CV via l'API HRFlow.ai

        Args:
            file_content: Contenu binaire du fichier
            filename: Nom du fichier
            content_type: Type MIME du fichier

        Returns:
            Profil parsé au format HRFlow

        Raises:
            HRFlowError: En cas d'erreur de l'API
        """
        url = f"{self.api_url}/profile/parsing/file"

        logger.info(f"[HRFlow] Parsing CV: {filename} ({len(file_content)} bytes)")

        try:
            # Multipart form-data pour l'upload
            files = {
                "file": (filename, file_content, content_type)
            }
            data = {
                "source_key": self.source_key,
                "sync_parsing": "1",  # Parsing synchrone
                "sync_parsing_indexing": "1",  # Indexation synchrone
            }

            # Headers : X-API-KEY requis, X-USER-EMAIL recommandé par l'API HRFlow
            headers = {"X-API-KEY": self.api_key}
            if getattr(self.settings, "HRFLOW_USER_EMAIL", None):
                headers["X-USER-EMAIL"] = self.settings.HRFLOW_USER_EMAIL

            response = requests.post(
                url,
                headers=headers,
                files=files,
                data=data,
                timeout=self.timeout
            )

            logger.info(f"[HRFlow] Response status: {response.status_code}")

            if response.status_code not in (200, 201):
                error_detail = response.text[:500]
                logger.error(f"[HRFlow] Error response: {error_detail}")
                raise HRFlowError(f"HRFlow API error: {response.status_code} - {error_detail}")

            result = response.json()

            # Vérifier la structure de la réponse HRFlow (data.profile ou data.parsing)
            if "data" not in result:
                logger.error(f"[HRFlow] Unexpected response structure: {list(result.keys())}")
                raise HRFlowError("Invalid HRFlow response: missing 'data' field")

            data = result["data"]
            # Structure API : data.profile (structuré) et data.parsing (brut)
            # Le mapper attend {profile: {...}} avec experiences, educations, etc.
            profile_obj = data.get("profile")
            parsing_obj = data.get("parsing") or {}
            if profile_obj:
                # Enrichir profile avec parsing si experiences/educations manquants
                profile_data = dict(profile_obj)
                if not profile_data.get("experiences") and parsing_obj.get("experiences"):
                    profile_data["experiences"] = parsing_obj["experiences"]
                if not profile_data.get("educations") and parsing_obj.get("educations"):
                    profile_data["educations"] = parsing_obj["educations"]
                if not profile_data.get("skills") and parsing_obj.get("skills"):
                    profile_data["skills"] = parsing_obj["skills"]
                hrflow_data = {"profile": profile_data}
            else:
                hrflow_data = {"profile": parsing_obj if isinstance(parsing_obj, dict) else data}

            profile_key = (hrflow_data.get("profile") or {}).get("key")
            logger.info(f"[HRFlow] Successfully parsed CV. Profile key: {profile_key}")

            return hrflow_data

        except RequestException as e:
            logger.error(f"[HRFlow] Request error: {str(e)}")
            raise HRFlowError(f"Network error calling HRFlow API: {str(e)}")

    def get_profile(self, profile_key: str) -> Optional[Dict[str, Any]]:
        """
        Récupère un profil existant par sa clé

        Args:
            profile_key: Clé du profil HRFlow

        Returns:
            Profil au format HRFlow ou None
        """
        url = f"{self.api_url}/profile/indexing"

        try:
            params = {
                "source_key": self.source_key,
                "key": profile_key
            }

            response = requests.get(
                url,
                headers=self.headers,
                params=params,
                timeout=self.timeout
            )

            if response.status_code == 404:
                return None

            if response.status_code != 200:
                logger.error(f"[HRFlow] Get profile error: {response.status_code}")
                return None

            result = response.json()
            return result.get("data")

        except RequestException as e:
            logger.error(f"[HRFlow] Get profile request error: {str(e)}")
            return None


class HRFlowError(Exception):
    """Exception pour les erreurs HRFlow"""
    pass


# Instance singleton
_hrflow_client: Optional[HRFlowClient] = None


def get_hrflow_client() -> HRFlowClient:
    """Retourne le client HRFlow (singleton)"""
    global _hrflow_client
    if _hrflow_client is None:
        _hrflow_client = HRFlowClient()
    return _hrflow_client
