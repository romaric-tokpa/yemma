"""
Gestion globale des exceptions
"""
from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


class DocumentError(Exception):
    """Exception de base pour les erreurs de documents"""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class FileTooLargeError(DocumentError):
    """Fichier trop volumineux"""
    def __init__(self, max_size: int):
        super().__init__(
            f"File size exceeds maximum allowed size of {max_size / 1024 / 1024}MB",
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
        )


class InvalidFileTypeError(DocumentError):
    """Type de fichier invalide"""
    def __init__(self, allowed_types: list):
        super().__init__(
            f"Invalid file type. Allowed types: {', '.join(allowed_types)}",
            status.HTTP_400_BAD_REQUEST
        )


class DocumentNotFoundError(DocumentError):
    """Document non trouvé"""
    def __init__(self, document_id: str):
        super().__init__(
            f"Document with id {document_id} not found",
            status.HTTP_404_NOT_FOUND
        )


async def document_error_handler(request: Request, exc: DocumentError):
    """Handler pour les erreurs de documents"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "path": str(request.url),
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handler pour les exceptions HTTP standard"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "path": str(request.url),
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler pour les erreurs de validation Pydantic"""
    import logging
    logger = logging.getLogger(__name__)
    
    errors = []
    for error in exc.errors():
        error_detail = {
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        }
        if "ctx" in error:
            error_detail["context"] = error["ctx"]
        errors.append(error_detail)
        logger.error(f"Validation error: {error_detail}")
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,  # Changed from 422 to 400
        content={
            "error": True,
            "message": "Validation error",
            "details": {"validation_errors": errors},
            "path": str(request.url),
        }
    )


def setup_exception_handlers(app: FastAPI):
    """Configure tous les handlers d'exceptions"""
    app.add_exception_handler(DocumentError, document_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

