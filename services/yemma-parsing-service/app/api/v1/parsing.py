"""
Endpoints API pour le parsing de CV via HRFlow.ai
"""
import base64
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from app.services.hrflow_client import get_hrflow_client, HRFlowError
from app.services.mapping import map_hrflow_to_yemma
from app.models.schemas import (
    ParsedCVResponse,
    ParseJobRequest,
    ParseJobStatus,
)
from app.tasks.parse_cv import parse_cv_async, get_parse_status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/parse", tags=["Parsing CV"])

# Types MIME acceptés
ALLOWED_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post(
    "/cv",
    response_model=ParsedCVResponse,
    summary="Parser un CV (synchrone)",
    description="""
    Parse un CV via HRFlow.ai et retourne les données structurées au format Yemma.

    **Formats acceptés:** PDF, DOCX
    **Taille max:** 10 MB

    Le parsing est synchrone et retourne directement le résultat.
    Pour les gros fichiers ou le traitement en masse, utilisez `/parse/cv/async`.
    """
)
async def parse_cv_sync(
    file: UploadFile = File(..., description="Fichier CV (PDF ou DOCX)"),
    email_override: Optional[str] = Form(default=None, description="Email à utiliser pour le profil")
) -> ParsedCVResponse:
    """Parse un CV de manière synchrone."""

    # Validation du type de fichier
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non supporté: {content_type}. Formats acceptés: PDF, DOCX"
        )

    # Lecture du contenu
    file_content = await file.read()

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Fichier trop volumineux. Taille max: {MAX_FILE_SIZE // (1024*1024)} MB"
        )

    if len(file_content) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide")

    filename = file.filename or "cv.pdf"
    logger.info(f"[API] Parsing CV: {filename} ({len(file_content)} bytes)")

    try:
        # Parser via HRFlow
        hrflow_client = get_hrflow_client()
        hrflow_data = hrflow_client.parse_cv(file_content, filename, content_type)

        # Mapper vers le format Yemma
        parsed_cv = map_hrflow_to_yemma(hrflow_data, email_override)

        logger.info(f"[API] CV parsed successfully: {parsed_cv.profile.first_name} {parsed_cv.profile.last_name}")

        return parsed_cv

    except HRFlowError as e:
        logger.error(f"[API] HRFlow error: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Erreur du service de parsing: {str(e)}")

    except Exception as e:
        logger.error(f"[API] Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors du parsing du CV")


@router.post(
    "/cv/async",
    response_model=ParseJobRequest,
    summary="Parser un CV (asynchrone)",
    description="""
    Lance le parsing d'un CV en tâche de fond via Celery.

    Retourne immédiatement un `job_id` pour suivre le statut.
    Utilisez `GET /parse/status/{job_id}` pour récupérer le résultat.
    """
)
async def parse_cv_async_endpoint(
    file: UploadFile = File(..., description="Fichier CV (PDF ou DOCX)"),
    email_override: Optional[str] = Form(default=None, description="Email à utiliser pour le profil")
) -> ParseJobRequest:
    """Lance le parsing asynchrone d'un CV."""

    # Validation du type de fichier
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non supporté: {content_type}"
        )

    # Lecture du contenu
    file_content = await file.read()

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Fichier trop volumineux. Taille max: {MAX_FILE_SIZE // (1024*1024)} MB"
        )

    if len(file_content) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide")

    filename = file.filename or "cv.pdf"
    job_id = f"parse_{uuid.uuid4().hex[:12]}"

    logger.info(f"[API] Starting async parse job: {job_id}")

    # Encoder en base64 pour Celery (JSON serializable)
    file_content_b64 = base64.b64encode(file_content).decode("utf-8")

    # Lancer la tâche Celery
    task = parse_cv_async.delay(
        file_content_b64=file_content_b64,
        filename=filename,
        content_type=content_type,
        email_override=email_override,
        job_id=job_id
    )

    return ParseJobRequest(
        job_id=task.id,
        status=ParseJobStatus.PENDING,
        result=None,
        error=None
    )


@router.get(
    "/status/{job_id}",
    response_model=ParseJobRequest,
    summary="Statut d'un job de parsing",
    description="Récupère le statut et le résultat d'un job de parsing asynchrone."
)
async def get_job_status(job_id: str) -> ParseJobRequest:
    """Récupère le statut d'un job de parsing."""

    logger.info(f"[API] Getting status for job: {job_id}")

    try:
        status_data = get_parse_status(job_id)

        # Reconstruire le résultat si disponible
        result = None
        if status_data.get("result"):
            result = ParsedCVResponse.model_validate(status_data["result"])

        return ParseJobRequest(
            job_id=status_data["job_id"],
            status=ParseJobStatus(status_data["status"]),
            result=result,
            error=status_data.get("error")
        )

    except Exception as e:
        logger.error(f"[API] Error getting job status: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Job non trouvé: {job_id}")


@router.get(
    "/health",
    summary="Health check",
    description="Vérifie que le service de parsing est opérationnel."
)
async def health_check():
    """Health check du service."""
    return {"status": "healthy", "service": "yemma-parsing-service"}
