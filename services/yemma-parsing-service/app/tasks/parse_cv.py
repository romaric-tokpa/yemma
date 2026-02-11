"""
Tâches Celery pour le parsing asynchrone de CV
"""
import logging
import json
from typing import Optional
from datetime import datetime
from celery import Task

from app.tasks.celery_app import celery_app
from app.services.hrflow_client import get_hrflow_client, HRFlowError
from app.services.mapping import map_hrflow_to_yemma
from app.models.schemas import ParseJobStatus

logger = logging.getLogger(__name__)


class ParseCVTask(Task):
    """Tâche de base avec gestion des retries"""
    autoretry_for = (HRFlowError,)
    retry_kwargs = {"max_retries": 3, "countdown": 5}
    retry_backoff = True


@celery_app.task(bind=True, base=ParseCVTask, name="parse_cv.parse")
def parse_cv_async(
    self,
    file_content_b64: str,
    filename: str,
    content_type: str,
    email_override: Optional[str] = None,
    job_id: Optional[str] = None
) -> dict:
    """
    Parse un CV de manière asynchrone via HRFlow.

    Args:
        file_content_b64: Contenu du fichier encodé en base64
        filename: Nom du fichier
        content_type: Type MIME
        email_override: Email à utiliser pour le profil
        job_id: ID du job pour le tracking

    Returns:
        dict avec status et résultat
    """
    import base64

    job_id = job_id or self.request.id
    logger.info(f"[ParseCV] Starting async parse job: {job_id}")

    try:
        # Décoder le contenu
        file_content = base64.b64decode(file_content_b64)

        # Parser via HRFlow
        hrflow_client = get_hrflow_client()
        hrflow_data = hrflow_client.parse_cv(file_content, filename, content_type)

        # Mapper vers le format Yemma
        parsed_cv = map_hrflow_to_yemma(hrflow_data, email_override)

        logger.info(f"[ParseCV] Job {job_id} completed successfully")

        return {
            "job_id": job_id,
            "status": ParseJobStatus.COMPLETED.value,
            "result": parsed_cv.model_dump(mode="json"),
            "completed_at": datetime.utcnow().isoformat(),
            "error": None
        }

    except HRFlowError as e:
        logger.error(f"[ParseCV] Job {job_id} failed: {str(e)}")
        raise  # Will be retried

    except Exception as e:
        logger.error(f"[ParseCV] Job {job_id} unexpected error: {str(e)}")
        return {
            "job_id": job_id,
            "status": ParseJobStatus.FAILED.value,
            "result": None,
            "completed_at": datetime.utcnow().isoformat(),
            "error": str(e)
        }


@celery_app.task(name="parse_cv.get_status")
def get_parse_status(task_id: str) -> dict:
    """
    Récupère le statut d'une tâche de parsing.

    Args:
        task_id: ID de la tâche Celery

    Returns:
        dict avec status et résultat si disponible
    """
    from celery.result import AsyncResult

    result = AsyncResult(task_id, app=celery_app)

    if result.ready():
        if result.successful():
            return result.get()
        else:
            return {
                "job_id": task_id,
                "status": ParseJobStatus.FAILED.value,
                "result": None,
                "error": str(result.result)
            }
    elif result.state == "STARTED":
        return {
            "job_id": task_id,
            "status": ParseJobStatus.PROCESSING.value,
            "result": None,
            "error": None
        }
    else:
        return {
            "job_id": task_id,
            "status": ParseJobStatus.PENDING.value,
            "result": None,
            "error": None
        }
